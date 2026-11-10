import hashlib
import io
import json
import asyncio
import time
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from django.conf import settings
import google.generativeai as genai
from PyPDF2 import PdfReader
from docx import Document
from .vision_service import VisionService

class DocumentService:
    """
    Servicio principal para procesamiento de documentos con IA.
    Maneja extracción de texto, análisis con Gemini y persistencia en Supabase.
    """
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.vision_service = VisionService()
    
    # Extracción local de datos clave mediante regex
    def extract_key_data_local(self, text: str) -> Dict[str, Any]:
        """Pre-procesa el texto buscando patrones comunes (RUC, facturas, fechas)"""
        ruc = re.search(r'RUC[:\s]*(\d{11})', text, re.IGNORECASE)
        factura = re.search(r'(?:Factura|Invoice|N°|Nro)[:\s]*(\d+(?:-\d+)*)', text, re.IGNORECASE)
        boleta = re.search(r'(?:Boleta|Recibo)[:\s]*(\d+)', text, re.IGNORECASE)
        totales = re.findall(r'(?:Total|TOTAL|Total a pagar)[:\s]*(?:S/\s*|USD\s*)?(\d+(?:[.,]\d{2})?)', text, re.IGNORECASE)
        fechas = re.findall(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
        
        return {
            'ruc': ruc.group(1) if ruc else None,
            'factura': factura.group(1) if factura else None,
            'boleta': boleta.group(1) if boleta else None,
            'totales': totales[:3],
            'fechas': fechas[:3],
            'has_tabla': '|' in text or '─' in text,
            'es_factura': bool(factura),
            'es_boleta': bool(boleta)
        }
    
    # Optimiza el texto priorizando contenido relevante
    def prioritize_text_content(self, text: str, max_chars: int = 20000) -> str:
        """Reordena el texto poniendo primero las líneas con información importante"""
        lines = text.split('\n')
        priority_lines = [l for l in lines if any([
            re.search(r'(Factura|Invoice|RUC|Total|Subtotal|IGV|Impuesto)', l, re.IGNORECASE),
            re.search(r'\d{2,}', l),
            '|' in l or '─' in l or '=' in l
        ])]
        remaining_lines = [l for l in lines if l not in priority_lines]
        reordered = priority_lines + remaining_lines
        reordered_text = '\n'.join(reordered)
        return reordered_text[:max_chars]
    
    # Genera el prompt para Gemini con instrucciones detalladas
    def get_optimized_prompt(self, text: str, local_data: Dict) -> str:
        """Construye el prompt completo para que Gemini analice el documento"""
        
        local_info = ""
        if local_data.get('ruc'): local_info += f"- Posible RUC: {local_data['ruc']}\n"
        if local_data.get('factura'): local_info += f"- Posible N° Doc: {local_data['factura']}\n"
        if local_data.get('fechas'): local_info += f"- Posibles fechas: {', '.join(local_data['fechas'])}\n"
        
        prompt = f"""Eres un experto en analisis documental UNIVERSAL. Tu trabajo es extraer TODA la informacion relevante de CUALQUIER tipo de documento.

    TEXTO DEL DOCUMENTO:
    {text}

    INFORMACION PRE-DETECTADA:
    {local_info if local_info else "Ninguna"}

    TU MISION:
    Analiza este documento y extrae TODA la informacion estructurada que encuentres, SIN IMPORTAR QUE TIPO DE DOCUMENTO SEA.

    REGLAS CRITICAS:
    1. NO asumas un tipo de documento especifico - DETECTA que es basandote en el contenido real
    2. Extrae TODOS los campos que encuentres explicitamente en el texto
    3. Si un campo NO EXISTE en el texto, usa null - NUNCA inventes datos
    4. PUEDES y DEBES crear etiquetas interpretativas y categorias basadas en el contenido
    5. NUNCA inventes: nombres, montos, fechas, numeros de documento, direcciones
    6. SI inventa: categorias, etiquetas descriptivas, clasificaciones, resumen interpretativo
    7. Para CADA campo que extraigas, asigna un "confidence" de 0.0 a 1.0
    8. Si el filename sugiere un tipo (ej: "CV_Juan.pdf"), consideralo pero VALIDA con el contenido

    ESTRUCTURA DE RESPUESTA (COMPLETAMENTE FLEXIBLE):

    {{
        "metadata": {{
            "document_type": "STRING (factura/cv/contrato/carta/reporte/cotizacion/acta/certificado/etc.)",
            "document_subtype": "STRING o null (ej: factura_comercial, cv_profesional)",
            "confidence_type": 0.0-1.0,
            
            // CAMPOS DINAMICOS - Solo agrega los que EXISTEN en el texto
            // NO inventes estos valores:
            "ruc": "STRING o null (SOLO si aparece en el texto)",
            "document_number": "STRING o null (numero de factura/boleta/contrato)",
            "date": "YYYY-MM-DD o null (fecha de emision/creacion)",
            "due_date": "YYYY-MM-DD o null",
            "expiration_date": "YYYY-MM-DD o null",
            "issue_date": "YYYY-MM-DD o null",
            "total_amount": null o numero (SOLO si esta explicito),
            "currency": "PEN|USD|EUR o null (SOLO si se menciona)",
            "issuer": "STRING o null (emisor/remitente real del documento)",
            "receiver": "STRING o null (receptor/destinatario real)",
            "issuer_address": "STRING o null (direccion real si existe)",
            "receiver_address": "STRING o null",
            "project_code": "STRING o null",
            "contract_number": "STRING o null",
            "reference_number": "STRING o null",
            
            // Para CVs (SOLO si aplica y existe en el texto):
            "candidate_name": "STRING o null (nombre real del candidato)",
            "age": null o numero (edad explicita o calculada de fecha de nacimiento)",
            "years_experience": null o numero (años totales calculados de experiencia)",
            "current_position": "STRING o null (puesto actual mencionado)",
            "current_company": "STRING o null (empresa actual mencionada)",
            "education_level": "secundaria|tecnico|universitario|posgrado|doctorado o null",
            "skills": ["array de skills mencionadas"] o null,
            "languages": ["array de idiomas mencionados"] o null,
            
            // Para contratos (SOLO si aplica):
            "contract_parties": ["parte 1 real", "parte 2 real"] o null,
            "contract_duration": "STRING o null (duracion mencionada)",
            "contract_value": null o numero (valor mencionado),
            "legal_representative": "STRING o null (representante mencionado)",
            
            // Para cualquier otro tipo:
            "custom_field_1": "valor real extraido",
            "custom_field_2": "valor real extraido",
            
            "detected_fields": ["lista", "de", "campos", "que", "encontraste"]
        }},
        
        "dynamic_fields": {{
            // AQUI van campos especificos del tipo de documento
            // Ejemplo para poliza de seguro (SOLO si es ese tipo):
            "policy_number": "valor real o null",
            "coverage_amount": numero real o null,
            "beneficiary": "nombre real o null",
            // Ejemplo para certificado medico:
            "diagnosis": "diagnostico real o null",
            "treatment": "tratamiento real o null",
            "doctor_name": "nombre real del doctor o null"
        }},
        
        "tags": [
            {{
                "tag": "STRING (etiqueta descriptiva interpretativa - PUEDES crearla)",
                "category": "document_type|topic|industry|urgency|status|custom",
                "confidence": 0.0-1.0
            }}
            // Genera entre 5-20 tags RELEVANTES basados en tu interpretacion
            // Estas etiquetas SI puedes crearlas interpretativamente
        ],
        
        "summary": {{
            "summary": "Resumen ejecutivo interpretativo de 2-4 lineas: QUE es, QUIENES participan, CUAL es el proposito/monto/tema principal. PUEDES interpretar y resumir.",
            "language": "es|en|pt|otro (detecta el idioma real)",
            "key_points": ["punto 1 interpretativo", "punto 2", "punto 3"]
        }},
        
        "entities": {{
            "personas": ["Nombre Completo 1 real", "Nombre 2 real"],
            "organizaciones": ["Empresa A real", "Entidad B real"],
            "lugares": ["Ciudad real", "Direccion completa real", "Pais real"],
            "fechas_clave": [
                {{"date": "YYYY-MM-DD real", "description": "descripcion interpretativa"}},
                {{"date": "YYYY-MM-DD real", "description": "descripcion interpretativa"}}
            ],
            "montos": [
                {{"amount": numero real, "currency": "moneda real", "concept": "concepto interpretativo"}}
            ],
            "numeros_referencia": ["REF-001 real", "DOC-123 real"]
        }},
        
        "items": [
            {{
                "name": "Descripcion real del item/producto/servicio",
                "type": "producto|servicio|concepto (clasificacion interpretativa)",
                "quantity": numero real o 1.0,
                "unit": "und|kg|hrs|m2|etc. (real o interpretado)",
                "unit_price": numero real o 0.00,
                "total_price": numero real o 0.00,
                "currency": "moneda real",
                "description": "Detalles adicionales reales",
                "code": "SKU o codigo real si existe"
            }}
            // Si NO hay items, devuelve array vacio []
        ],
        
        "content_structure": {{
            "has_header": true|false (interpreta si tiene encabezado),
            "has_footer": true|false (interpreta si tiene pie de pagina),
            "has_signature": true|false (detecta firmas),
            "has_stamps": true|false (detecta sellos),
            "has_tables": true|false (detecta tablas),
            "has_lists": true|false (detecta listas),
            "sections": ["Seccion 1 detectada", "Seccion 2 detectada"]
        }}
    }}

    EJEMPLOS DE ANALISIS CORRECTO:

    EJEMPLO 1 - Poliza de Seguro:
    {{
        "metadata": {{
            "document_type": "poliza_seguro",
            "document_subtype": "seguro_vehicular",
            "confidence_type": 0.95,
            "document_number": "POL-2024-001234",
            "date": "2024-01-15",
            "issuer": "Seguros La Protectora S.A.",
            "receiver": "Juan Carlos Perez Lopez",
            "detected_fields": ["document_number", "date", "issuer", "receiver"]
        }},
        "dynamic_fields": {{
            "policy_number": "POL-2024-001234",
            "vehicle_plate": "ABC-123",
            "coverage_type": "Todo Riesgo",
            "coverage_amount": 50000.00,
            "premium_amount": 1500.00,
            "validity_period": "1 año"
        }},
        "tags": [
            {{"tag": "seguro vehicular", "category": "document_type", "confidence": 1.0}},
            {{"tag": "todo riesgo", "category": "topic", "confidence": 0.9}},
            {{"tag": "activo", "category": "status", "confidence": 0.85}}
        ],
        "summary": {{
            "summary": "Poliza de seguro vehicular todo riesgo emitida por Seguros La Protectora para el vehiculo ABC-123 propiedad de Juan Carlos Perez Lopez. Cobertura de 50,000 soles con prima anual de 1,500 soles.",
            "language": "es",
            "key_points": ["Cobertura todo riesgo", "Vigencia 1 año", "Prima 1,500 soles"]
        }}
    }}

    EJEMPLO 2 - CV con nombre en archivo "CV_Maria_Lopez.pdf":
    {{
        "metadata": {{
            "document_type": "cv",
            "document_subtype": "cv_profesional",
            "confidence_type": 0.98,
            "candidate_name": "Maria Lopez Garcia",
            "age": 28,
            "years_experience": 5,
            "current_position": "Analista de Sistemas Senior",
            "current_company": "TechCorp S.A.",
            "education_level": "universitario",
            "skills": ["Python", "Django", "PostgreSQL", "React", "Git"],
            "languages": ["Español", "Ingles"],
            "detected_fields": ["candidate_name", "age", "years_experience", "current_position", "current_company", "education_level", "skills", "languages"]
        }},
        "dynamic_fields": {{
            "title": "Ingeniera de Sistemas",
            "availability": "Inmediata",
            "expected_salary": null
        }},
        "tags": [
            {{"tag": "cv profesional", "category": "document_type", "confidence": 1.0}},
            {{"tag": "tecnologia", "category": "industry", "confidence": 0.95}},
            {{"tag": "desarrollo software", "category": "topic", "confidence": 0.9}},
            {{"tag": "experiencia senior", "category": "custom", "confidence": 0.85}},
            {{"tag": "bilingue", "category": "custom", "confidence": 0.9}}
        ],
        "entities": {{
            "personas": ["Maria Lopez Garcia"],
            "organizaciones": ["TechCorp S.A.", "Universidad Nacional", "IBM Peru"],
            "lugares": ["Lima", "Peru"]
        }},
        "summary": {{
            "summary": "Curriculum vitae de Maria Lopez Garcia, Ingeniera de Sistemas con 5 años de experiencia en desarrollo de software. Actualmente se desempeña como Analista de Sistemas Senior en TechCorp. Domina Python, Django y React. Nivel bilingue español-ingles.",
            "language": "es",
            "key_points": ["5 años de experiencia", "Stack Python/Django/React", "Posicion senior actual", "Bilingue"]
        }}
    }}

    EJEMPLO 3 - Factura con datos reales:
    {{
        "metadata": {{
            "document_type": "factura",
            "document_subtype": "factura_comercial",
            "confidence_type": 1.0,
            "ruc": "20123456789",
            "document_number": "F001-00012345",
            "date": "2024-12-20",
            "due_date": "2025-01-20",
            "total_amount": 1250.50,
            "currency": "PEN",
            "issuer": "Distribuidora El Sol S.A.C.",
            "receiver": "Corporacion ABC S.A.",
            "issuer_address": "Av. Los Pinos 456, Lima",
            "receiver_address": "Jr. Comercio 789, Lima",
            "detected_fields": ["ruc", "document_number", "date", "due_date", "total_amount", "currency", "issuer", "receiver", "issuer_address", "receiver_address"]
        }},
        "tags": [
            {{"tag": "factura comercial", "category": "document_type", "confidence": 1.0}},
            {{"tag": "venta de mercaderia", "category": "topic", "confidence": 0.9}},
            {{"tag": "comercio", "category": "industry", "confidence": 0.85}},
            {{"tag": "pago pendiente", "category": "status", "confidence": 0.8}}
        ],
        "items": [
            {{
                "name": "Arroz Superior 50kg",
                "type": "producto",
                "quantity": 20.0,
                "unit": "und",
                "unit_price": 58.50,
                "total_price": 1170.00,
                "currency": "PEN",
                "code": "ARR-50K"
            }},
            {{
                "name": "Aceite Vegetal 1L",
                "type": "producto",
                "quantity": 10.0,
                "unit": "und",
                "unit_price": 8.05,
                "total_price": 80.50,
                "currency": "PEN",
                "code": "ACE-01L"
            }}
        ]
    }}

    INSTRUCCIONES FINALES:
    - Responde SOLO con el JSON, sin texto adicional
    - NO uses comillas triples ni markdown
    - Si un campo concreto no existe en el texto, usa null
    - Para arrays vacios, usa []
    - SIEMPRE llena "detected_fields" con los campos que encontraste
    - Se EXHAUSTIVO pero PRECISO
    - NUNCA inventes datos concretos (nombres, montos, fechas)
    - SI puedes crear interpretaciones (tags, resumen, clasificaciones)

    Responde AHORA:
    """
        return prompt
    
    # Calcula hash SHA256 del archivo para detectar duplicados
    def calculate_file_hash(self, content: bytes) -> str:
        """Genera un identificador único del archivo basado en su contenido"""
        return hashlib.sha256(content).hexdigest()
    
    # Extrae texto de archivos PDF
    def extract_text_from_pdf(self, content: bytes) -> Tuple[str, int]:
        """Lee PDFs y devuelve el texto completo + número de páginas"""
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text, len(reader.pages)
    
    # Extrae texto de archivos Word
    def extract_text_from_docx(self, content: bytes) -> Tuple[str, int]:
        """Lee archivos DOCX y devuelve el texto completo + número de párrafos"""
        docx_file = io.BytesIO(content)
        doc = Document(docx_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text, len(doc.paragraphs)
    
    # Verifica si el documento ya fue subido anteriormente
    def check_duplicate(self, file_hash: str) -> Optional[Dict[str, Any]]:
        """Busca en BD si ya existe un archivo con el mismo hash"""
        try:
            result = self.supabase.table('documents').select('*').eq('file_hash', file_hash).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error checking duplicate: {e}")
            return None
    
    # Sistema de reintentos para operaciones de BD que pueden fallar temporalmente
    def _execute_with_retry(self, func, max_retries=3, delay=1):
        """Reintenta operaciones que fallan por problemas de conexión"""
        for attempt in range(max_retries):
            try:
                return func()
            except Exception as e:
                error_msg = str(e).lower()
                is_connection_error = any(keyword in error_msg for keyword in [
                    'disconnect', 'connection', 'timeout', 'network', 'unreachable'
                ])
                if is_connection_error and attempt < max_retries - 1:
                    time.sleep(delay)
                    continue
                raise
        raise Exception(f"Max retries ({max_retries}) exceeded")
    
    # Crea registro inicial del documento en la BD (con batch)
    def create_document_record(self, user_id: str, batch_id: str, filename: str, file_type: str, 
                            file_size: int, file_hash: str, file_path: str) -> Dict[str, Any]:
        """Inserta un nuevo documento en la BD y lo asocia a un batch de procesamiento"""
        try:
            def insert_document():
                return self.supabase.table('documents').insert({
                    'user_id': user_id,
                    'batch_id': batch_id,
                    'filename': filename,
                    'file_type': file_type,
                    'file_size': file_size,
                    'file_hash': file_hash,
                    'file_path': file_path,
                    'state': 'pending',
                    'metadata': {},
                    'dynamic_fields': {},
                    'tags': [],
                    'entities': {},
                    'summary': {},
                    'items': [],
                    'visual_features': {},
                    'detected_objects': [],
                    'layout_analysis': {},
                    'authenticity_check': {}
                }).execute()
            
            result = self._execute_with_retry(insert_document)
            document = result.data[0]
            
            def increment_counter():
                return self.supabase.rpc('increment_batch_count', {'p_batch_id': batch_id}).execute()
            
            self._execute_with_retry(increment_counter)
            
            return {'success': True, 'document': document}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # Crea registro inicial del documento en la BD (sin batch)
    def create_document_record_without_batch(self, user_id: str, filename: str, file_type: str,
                                        file_size: int, file_hash: str, file_path: str) -> Dict[str, Any]:
        """Inserta un nuevo documento en la BD sin asociarlo a ningún batch"""
        try:
            def insert_document():
                return self.supabase.table('documents').insert({
                    'user_id': user_id,
                    'batch_id': None,
                    'filename': filename,
                    'file_type': file_type,
                    'file_size': file_size,
                    'file_hash': file_hash,
                    'file_path': file_path,
                    'state': 'pending',
                    'metadata': {},
                    'dynamic_fields': {},
                    'tags': [],
                    'entities': {},
                    'summary': {},
                    'items': [],
                    'visual_features': {},
                    'detected_objects': [],
                    'layout_analysis': {},
                    'authenticity_check': {}
                }).execute()
            
            result = self._execute_with_retry(insert_document)
            document = result.data[0]
            return {'success': True, 'document': document}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # Envía el texto a Gemini y recibe análisis estructurado
    async def analyze_with_gemini(self, text: str, max_chars: int = 30000) -> Dict[str, Any]:
        """Analiza el documento con IA y devuelve metadata, tags, entidades, items, etc."""
        try:
            local_data = self.extract_key_data_local(text)
            optimized_text = self.prioritize_text_content(text, max_chars)
            prompt = self.get_optimized_prompt(optimized_text, local_data)
            
            loop = asyncio.get_event_loop()
            generation_config = genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
            
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt, generation_config=generation_config)
            )
            
            response_text = response.text.strip()
            if response_text.startswith("```"):
                response_text = re.sub(r'^```json\s*|\s*```$', "", response_text, flags=re.MULTILINE)

            analysis = json.loads(response_text)
            
            # Limpieza de datos numéricos
            if isinstance(analysis.get('metadata', {}).get('total_amount'), str):
                try:
                    clean_amount = re.sub(r'[^\d.]', '', str(analysis['metadata']['total_amount']))
                    analysis['metadata']['total_amount'] = float(clean_amount) if clean_amount else 0.0
                except:
                    analysis['metadata']['total_amount'] = 0.0

            for item in analysis.get("items", []):
                for field in ["quantity", "unit_price", "total_price"]:
                    if field in item:
                        try:
                            item[field] = float(str(item[field]).replace(',', ''))
                        except:
                            item[field] = 0.0
            
            return analysis
            
        except json.JSONDecodeError as e:
            return self._get_fallback_analysis("Error de formato JSON")
            
        except Exception as e:
            error_str = str(e).lower()
            if '429' in error_str or 'quota' in error_str or 'resource exhausted' in error_str:
                raise Exception("QUOTA_EXCEEDED")
            
            return self._get_fallback_analysis(str(e))
    
    # Devuelve estructura mínima cuando falla el análisis de IA
    def _get_fallback_analysis(self, error_msg: str = "") -> Dict[str, Any]:
        """Genera respuesta de respaldo cuando Gemini no puede procesar el documento"""
        return {
            "tags": [
                {"tag": "documento", "confidence": 0.3, "category": "general"},
                {"tag": "procesamiento_fallido", "confidence": 1.0, "category": "status"}
            ],
            "summary": {
                "summary": f"Documento no procesado correctamente. Error: {error_msg[:100]}", 
                "word_count": 0, 
                "page_count": 0, 
                "language": "desconocido",
                "key_points": []
            },
            "metadata": {
                "document_type": "desconocido",
                "confidence_type": 0.1,
                "detected_fields": [],
                "processing_error": error_msg
            },
            "dynamic_fields": {},
            "items": [],
            "entities": {
                "personas": [], 
                "organizaciones": [], 
                "lugares": [],
                "fechas_clave": [],
                "montos": [],
                "numeros_referencia": []
            },
            "content_structure": {
                "has_header": False,
                "has_footer": False,
                "has_signature": False,
                "has_stamps": False,
                "has_tables": False,
                "has_lists": False,
                "sections": []
            }
        }
    
    # Guarda el análisis completo en la BD
    def save_analysis_to_db(self, document_id: str, analysis: Dict[str, Any], 
                        extracted_text: str, word_count: int, page_count: int, 
                        visual_analysis: Optional[Dict[str, Any]] = None):
        """Actualiza el documento en BD con todos los resultados del análisis"""
        try:
            summary = analysis.get('summary', {})
            if isinstance(summary, dict):
                summary['word_count'] = word_count
                summary['page_count'] = page_count
                if 'key_points' not in summary:
                    summary['key_points'] = []
            else:
                summary = {
                    'summary': str(summary) if summary else 'Sin resumen',
                    'word_count': word_count,
                    'page_count': page_count,
                    'language': 'desconocido',
                    'key_points': []
                }
            
            update_data = {
                'metadata': analysis.get('metadata', {}),
                'dynamic_fields': analysis.get('dynamic_fields', {}),
                'tags': analysis.get('tags', []),
                'entities': analysis.get('entities', {
                    'personas': [],
                    'organizaciones': [],
                    'lugares': [],
                    'fechas_clave': [],
                    'montos': [],
                    'numeros_referencia': []
                }),
                'summary': summary,
                'items': analysis.get('items', []),
                'extracted_text': extracted_text[:100000]
            }
            
            # Agregar análisis visual si existe
            if visual_analysis:
                update_data['visual_features'] = visual_analysis.get('visual_features', {})
                update_data['detected_objects'] = visual_analysis.get('detected_objects', [])
                update_data['layout_analysis'] = visual_analysis.get('layout_analysis', {})
                update_data['authenticity_check'] = visual_analysis.get('authenticity_check', {})
            
            def update_document():
                return self.supabase.table('documents').update(update_data).eq('id', document_id).execute()
            
            self._execute_with_retry(update_document)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise
    
    # Actualiza el estado del documento (pending, processing, completed, failed)
    def update_document_state(self, document_id: str, state: str, error_message: Optional[str] = None):
        """Cambia el estado del documento en BD y registra la hora de procesamiento"""
        try:
            update_data = {'state': state, 'processed_at': datetime.now().isoformat()}
            if error_message:
                update_data['error_message'] = error_message
            
            def update_main():
                return self.supabase.table('documents').update(update_data).eq('id', document_id).execute()
            
            self._execute_with_retry(update_main)
            
        except Exception as e:
            print(f"Error actualizando estado: {e}")
    
    # Función principal: procesa un documento completo de inicio a fin
    async def process_document_complete(self, document_id: str, content: bytes, file_type: str) -> bool:
        """
        Pipeline completo de procesamiento:
        1. Extrae texto (PDF/DOCX)
        2. Analiza con Gemini (texto)
        3. Analiza aspectos visuales (opcional)
        4. Guarda todo en BD
        """
        try:
            self.update_document_state(document_id, 'processing')
            
            # Extracción de texto
            if file_type == 'pdf':
                text, page_count = self.extract_text_from_pdf(content)
            else:
                text, page_count = self.extract_text_from_docx(content)
            
            word_count = len(text.split())
            
            # Análisis con Gemini (texto)
            try:
                text_analysis = await self.analyze_with_gemini(text)
            except Exception as e:
                if "QUOTA_EXCEEDED" in str(e):
                    self.update_document_state(document_id, 'pending', "Cuota API excedida - reintentará")
                    raise
                raise
            
            # Análisis visual (opcional)
            visual_analysis = None
            try:
                visual_analysis = await self.vision_service.analyze_document_visual(
                    content, 
                    file_type,
                    text[:1000]
                )
            except Exception as e:
                pass  # No detener el procesamiento si falla el análisis visual
            
            # Guardar todo en BD
            self.save_analysis_to_db(
                document_id, 
                text_analysis, 
                text, 
                word_count, 
                page_count,
                visual_analysis
            )
            
            self.update_document_state(document_id, 'completed')
            return True
            
        except Exception as e:
            if "QUOTA_EXCEEDED" not in str(e):
                self.update_document_state(document_id, 'failed', str(e))
            return False
    
    # Obtiene un documento completo con todos sus datos
    def get_document_full(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Recupera un documento de BD con todos sus campos (usa vista documents_full)"""
        try:
            result = self.supabase.from_('documents_full').select('*').eq('id', document_id).single().execute()
            
            if not result.data:
                return None
            
            document = result.data
            return document
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
    
    # Verifica que el usuario existe en la BD
    def _validate_user_exists(self, user_id: str) -> bool:
        """Comprueba si el user_id es válido"""
        try:
            result = self.supabase.table('users').select('id').eq('id', user_id).execute()
            return len(result.data) > 0
        except Exception as e:
            return False
    
    # Obtiene el total de documentos que cumplen los filtros
    def _get_total_count(self, state: Optional[str] = None, batch_id: Optional[str] = None) -> int:
        """Cuenta documentos en BD con filtros opcionales"""
        try:
            query = self.supabase.table('documents').select('id', count='exact')
            if state:
                query = query.eq('state', state)
            if batch_id:
                query = query.eq('batch_id', batch_id)
            result = query.execute()
            return result.count if hasattr(result, 'count') else 0
        except Exception as e:
            return 0
    
    # Lista documentos con paginación y filtros
    def list_documents(self, user_id: Optional[str] = None, state: Optional[str] = None,
                      batch_id: Optional[str] = None, limit: int = 20, offset: int = 0,
                      fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Devuelve lista de documentos con paginación.
        Soporta filtros por estado y batch_id.
        """
        try:
            if not user_id:
                return {'success': False, 'error': 'user_id es requerido', 'documents': [], 'count': 0, 'pagination': {}}
            
            if not self._validate_user_exists(user_id):
                return {'success': False, 'error': 'Usuario no encontrado', 'documents': [], 'count': 0, 'pagination': {}}
            
            if limit > 50:
                limit = 50
            if limit < 1:
                limit = 20
            total_count = self._get_total_count(state=state, batch_id=batch_id)
            
            if fields is None:
                select_fields = ['id', 'filename', 'upload_date', 'state']
            else:
                select_fields = fields

            select_query_string = ', '.join(select_fields)
            query = self.supabase.table('documents').select(select_query_string)
            
            if state:
                query = query.eq('state', state)
            
            if batch_id:
                query = query.eq('batch_id', batch_id)
            
            result = query.order('upload_date', desc=True).range(offset, offset + limit - 1).execute()
            
            documents = result.data
            count = len(documents)
            
            total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
            current_page = (offset // limit) + 1
            has_next = (offset + limit) < total_count
            has_previous = offset > 0
            
            return {
                'success': True,
                'documents': documents,
                'count': count,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_previous': has_previous,
                    'next_offset': offset + limit if has_next else None,
                    'previous_offset': max(0, offset - limit) if has_previous else None
                },
                'filters_applied': {'state': state, 'batch_id': batch_id}
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e), 'documents': [], 'count': 0, 'pagination': {}}
    
    # Obtiene documentos pendientes de procesar
    def get_pending_documents(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Devuelve hasta 'limit' documentos en estado 'pending'"""
        try:
            result = self.supabase.table('documents').select('*').eq('state', 'pending').limit(limit).execute()
            return result.data
        except Exception as e:
            return []
    
    # Asigna un documento a un batch específico
    def assign_to_batch(self, document_id: str, batch_id: str):
        """Vincula un documento con un batch de procesamiento"""
        try:
            def update_doc():
                return self.supabase.table('documents').update({'batch_id': batch_id}).eq('id', document_id).execute()
            self._execute_with_retry(update_doc)
        except Exception as e:
            raise