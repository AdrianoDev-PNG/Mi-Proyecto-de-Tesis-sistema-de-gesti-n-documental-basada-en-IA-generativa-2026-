import io
import base64
import json
import re
from typing import Dict, List, Any, Optional
from PIL import Image
from pdf2image import convert_from_bytes
import google.generativeai as genai
from django.conf import settings

class VisionService:
    """
    Servicio de análisis visual de documentos usando Gemini Vision.
    Detecta elementos visuales como tablas, firmas, sellos y evalúa autenticidad.
    Complementa el análisis de texto tradicional con información visual.
    """
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    # Convierte páginas de PDF en imágenes para procesamiento visual
    def pdf_to_images(self, pdf_content: bytes, max_pages: int = 10) -> List[Image.Image]:
        """
        Convierte PDF a imágenes usando pdf2image + Poppler.
        Necesario porque Gemini Vision requiere imágenes, no PDFs directamente.
        """
        try:
            from pathlib import Path
            import os
            
            poppler_path = getattr(settings, 'POPPLER_PATH', None)
            
            convert_args = {
                'pdf_file': pdf_content,
                'dpi': 200,
                'first_page': 1,
                'last_page': max_pages,
                'fmt': 'jpeg'
            }
            
            # Configurar Poppler definido en settings
            if poppler_path and poppler_path.strip():
                poppler_path_obj = Path(poppler_path)
                
                # Convertir a ruta absoluta si es relativa
                if not poppler_path_obj.is_absolute():
                    poppler_path_obj = settings.BASE_DIR / poppler_path
                
                if poppler_path_obj.exists():
                    convert_args['poppler_path'] = str(poppler_path_obj)
            
            images = convert_from_bytes(**convert_args)
            
            return images
            
        except Exception as e:
            return []
    
    # Convierte imagen PIL a base64 para enviar a Gemini
    def image_to_base64(self, image: Image.Image) -> str:
        """Serializa imagen a base64 (formato requerido por algunas APIs)"""
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    # Función principal: análisis visual completo del documento
    async def analyze_document_visual(
        self, 
        content: bytes, 
        file_type: str,
        extracted_text: str = ""
    ) -> Dict[str, Any]:
        """
        Análisis visual completo: estructura, objetos detectados y autenticidad.
        Procesa primera página en detalle y páginas adicionales en modo rápido.
        """
        try:
            # Convertir documento a imágenes
            if file_type == 'pdf':
                images = self.pdf_to_images(content, max_pages=5)
            else:
                # DOCX no soportado en análisis visual por ahora
                return self._get_fallback_visual_analysis()
            
            if not images:
                return self._get_fallback_visual_analysis()
            
            # Análisis profundo de la primera página
            main_analysis = await self._analyze_single_page(images[0], extracted_text, is_first_page=True)
            
            # Análisis superficial de páginas adicionales
            if len(images) > 1:
                additional_features = await self._analyze_additional_pages(images[1:])
                main_analysis = self._merge_analyses(main_analysis, additional_features)
            
            return main_analysis
            
        except Exception as e:
            return self._get_fallback_visual_analysis()
    
    # Analiza una página individual con Gemini Vision
    async def _analyze_single_page(
        self, 
        image: Image.Image, 
        extracted_text: str,
        is_first_page: bool = True
    ) -> Dict[str, Any]:
        """
        Envía imagen a Gemini Vision para detectar:
        - Estructura del documento (secciones, layout)
        - Objetos visuales (tablas, firmas, sellos, logos)
        - Características visuales (calidad, marcas de agua)
        - Indicadores de autenticidad
        """
        
        prompt = f"""Analiza esta imagen de documento y proporciona un análisis JSON detallado.

Contexto del texto extraído (para referencia):
{extracted_text[:500] if extracted_text else "No disponible"}

INSTRUCCIONES DE ANÁLISIS:

1. ESTRUCTURA VISUAL (layout_analysis):
   - Identifica el tipo de documento por su apariencia (factura, contrato, carta, etc.)
   - Detecta secciones visuales: encabezado, cuerpo, pie de página, tablas
   - Analiza la distribución de elementos en la página

2. OBJETOS DETECTADOS (detected_objects):
   - Tablas: ubicación, número de filas/columnas estimadas
   - Firmas: detectar presencia y ubicación aproximada
   - Sellos: detectar sellos oficiales o timbres
   - Logos: identificar logos de empresas
   - Códigos de barras/QR: detectar si existen
   - Imágenes/gráficos: detectar elementos visuales adicionales

3. CARACTERÍSTICAS VISUALES (visual_features):
   - Calidad del documento: escaneado/digital/fotografiado
   - Orientación: vertical/horizontal
   - Tiene marca de agua: sí/no
   - Colores predominantes
   - Nivel de complejidad visual: simple/medio/complejo

4. VALIDACIÓN DE AUTENTICIDAD (authenticity_check):
   - Tiene firmas manuscritas: sí/no/desconocido
   - Tiene sellos oficiales: sí/no
   - Aspecto profesional: sí/no
   - Posibles indicadores de autenticidad

Responde SOLO con este JSON (sin comentarios ni texto adicional):

{{
    "layout_analysis": {{
        "document_structure": "factura|contrato|carta|reporte|formulario|otro",
        "sections": ["header", "body", "footer", "signature_area"],
        "has_header": true,
        "has_footer": true,
        "page_orientation": "portrait|landscape",
        "complexity": "simple|medium|complex"
    }},
    "detected_objects": [
        {{
            "type": "table|signature|stamp|logo|barcode|qr_code|image",
            "confidence": 0.95,
            "location": "top|middle|bottom|left|right",
            "details": {{
                "rows": 10,
                "columns": 5
            }}
        }}
    ],
    "visual_features": {{
        "document_quality": "digital|scanned|photographed|poor",
        "has_watermark": false,
        "predominant_colors": ["white", "black", "blue"],
        "text_clarity": "high|medium|low",
        "has_handwriting": false,
        "visual_complexity": "simple|medium|complex"
    }},
    "authenticity_check": {{
        "has_signature": true,
        "signature_type": "digital|handwritten|none",
        "has_official_stamp": false,
        "professional_appearance": true,
        "confidence_score": 0.85,
        "notes": "Documento aparenta ser original"
    }}
}}
"""
        
        try:
            # Llamada a Gemini Vision con imagen + prompt
            response = self.model.generate_content([
                prompt,
                image
            ], generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            ))
            
            response_text = response.text.strip()
            
            # Limpiar markdown si viene con backticks
            if response_text.startswith("```"):
                response_text = re.sub(r'^```json\s*|\s*```$', "", response_text, flags=re.MULTILINE)
            
            analysis = json.loads(response_text)
            
            # Agregar metadata de procesamiento
            analysis['processing_info'] = {
                'is_first_page': is_first_page,
                'image_size': f"{image.width}x{image.height}",
                'processed_at': 'gemini-vision'
            }
            
            return analysis
            
        except json.JSONDecodeError as e:
            return self._get_fallback_visual_analysis()
        except Exception as e:
            return self._get_fallback_visual_analysis()
    
    # Análisis rápido de páginas 2 en adelante
    async def _analyze_additional_pages(self, images: List[Image.Image]) -> Dict[str, Any]:
        """
        Analiza páginas adicionales de forma simplificada.
        Solo detecta presencia de tablas, firmas y sellos (no hace análisis completo).
        """
        
        additional_tables = 0
        additional_signatures = 0
        
        for idx, image in enumerate(images[:4], 2):  # Máximo 4 páginas adicionales
            try:
                prompt = f"""Analiza brevemente esta página {idx} y responde SOLO:
{{
    "has_tables": true/false,
    "has_signatures": true/false,
    "has_stamps": true/false
}}
"""
                response = self.model.generate_content([prompt, image])
                response_text = response.text.strip()
                response_text = re.sub(r'^```json\s*|\s*```$', "", response_text, flags=re.MULTILINE)
                
                page_data = json.loads(response_text)
                if page_data.get('has_tables'):
                    additional_tables += 1
                if page_data.get('has_signatures'):
                    additional_signatures += 1
                    
            except Exception as e:
                continue
        
        return {
            'additional_pages_analyzed': len(images),
            'additional_tables_found': additional_tables,
            'additional_signatures_found': additional_signatures
        }
    
    # Combina análisis de primera página con info de páginas adicionales
    def _merge_analyses(self, main: Dict[str, Any], additional: Dict[str, Any]) -> Dict[str, Any]:
        """Integra hallazgos de páginas adicionales al análisis principal"""
        
        # Agregar tablas encontradas en páginas adicionales
        if 'detected_objects' in main:
            if additional.get('additional_tables_found', 0) > 0:
                main['detected_objects'].append({
                    'type': 'table',
                    'confidence': 0.8,
                    'location': 'additional_pages',
                    'details': {
                        'additional_tables': additional['additional_tables_found']
                    }
                })
        
        # Agregar metadata de procesamiento multipágina
        main['multi_page_analysis'] = additional
        
        return main
    
    # Estructura de respaldo cuando falla el análisis visual
    def _get_fallback_visual_analysis(self) -> Dict[str, Any]:
        """
        Retorna estructura vacía cuando el análisis visual no está disponible.
        Evita que falle el procesamiento completo del documento.
        """
        return {
            "layout_analysis": {
                "document_structure": "unknown",
                "sections": [],
                "has_header": False,
                "has_footer": False,
                "page_orientation": "portrait",
                "complexity": "unknown"
            },
            "detected_objects": [],
            "visual_features": {
                "document_quality": "unknown",
                "has_watermark": False,
                "predominant_colors": [],
                "text_clarity": "unknown",
                "has_handwriting": False,
                "visual_complexity": "unknown"
            },
            "authenticity_check": {
                "has_signature": False,
                "signature_type": "none",
                "has_official_stamp": False,
                "professional_appearance": False,
                "confidence_score": 0.0,
                "notes": "Análisis visual no disponible"
            },
            "error": "Visual analysis failed or not available"
        }