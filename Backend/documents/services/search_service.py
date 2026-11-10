import json
import asyncio
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from django.conf import settings
import google.generativeai as genai

class SearchService:
    """
    Motor de búsqueda inteligente para documentos.
    Combina IA (Gemini) para entender queries naturales con búsqueda fulltext,
    fuzzy matching y filtros específicos por tipo de documento.
    """
    
    def __init__(self):
        self.supabase = settings.SUPABASE_CLIENT
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Diccionario de sinónimos para búsqueda semántica
        self.synonyms = {
            # Documentos financieros
            'factura': ['invoice', 'bill', 'recibo', 'comprobante de pago'],
            'boleta': ['ticket', 'comprobante', 'voucher'],
            'pago': ['payment', 'abono', 'cancelación', 'transacción'],
            'total': ['monto', 'importe', 'valor', 'suma', 'cantidad'],
            'cliente': ['comprador', 'adquiriente', 'consumidor'],
            'proveedor': ['vendedor', 'emisor', 'supplier', 'distribuidor'],
            'producto': ['item', 'artículo', 'servicio', 'bien'],
            'precio': ['costo', 'valor', 'tarifa', 'monto'],
            
            # CVs y recursos humanos
            'cv': ['curriculum', 'curriculo', 'resume', 'hoja de vida', 'curriculum vitae'],
            'experiencia': ['trayectoria', 'historial laboral', 'background', 'carrera'],
            'habilidad': ['skill', 'competencia', 'destreza', 'capacidad', 'conocimiento'],
            'educacion': ['formación', 'estudios', 'académico', 'título', 'carrera'],
            'trabajo': ['empleo', 'puesto', 'cargo', 'posición', 'ocupación'],
            'idioma': ['language', 'lengua'],
            'certificacion': ['certificado', 'diploma', 'acreditación'],
            
            # Contratos y legales
            'contrato': ['agreement', 'convenio', 'acuerdo'],
            'clausula': ['condición', 'término', 'estipulación'],
            
            # Correspondencia
            'carta': ['letter', 'comunicado', 'misiva'],
            'email': ['correo', 'mail', 'mensaje electrónico'],
            'memo': ['memorandum', 'nota interna'],
            
            # Otros
            'reporte': ['informe', 'report', 'análisis'],
            'cotizacion': ['presupuesto', 'quote', 'propuesta'],
        }

        # Mapeo de tipos de documentos soportados
        self.document_types = {
            'cv': ['cv', 'curriculum', 'resume', 'hoja de vida'],
            'factura': ['factura', 'invoice', 'bill'],
            'boleta': ['boleta', 'ticket', 'comprobante'],
            'contrato': ['contrato', 'contract', 'agreement'],
            'carta': ['carta', 'letter', 'comunicado'],
            'reporte': ['reporte', 'informe', 'report'],
            'cotizacion': ['cotización', 'presupuesto', 'quote'],
        }
    
    # Usa Gemini para interpretar la búsqueda en lenguaje natural
    async def process_search_query(self, user_query: str) -> Dict[str, Any]:
        """
        Analiza una búsqueda en lenguaje natural y la convierte en filtros estructurados.
        Ejemplos: "CVs de desarrolladores Python" → filtros de CV con habilidad Python
                  "facturas entre 80 y 100 soles" → filtros de precio y moneda
        """
        prompt = f"""Analiza esta consulta de búsqueda de documentos y determina QUÉ busca el usuario.

        Consulta: "{user_query}"

        El sistema maneja MÚLTIPLES tipos de documentos:
        - CVs/Currículums (con edad, experiencia, habilidades, educación)
        - Facturas y documentos financieros (con montos, productos)
        - Contratos (con partes, fechas, cláusulas)
        - Correspondencia (cartas, emails, memos)
        - Reportes y análisis
        - Cotizaciones y presupuestos

        REGLAS DE ANÁLISIS:
        1. Si menciona "todos", "todo", "listar" → intent: "listar_todos"
        2. Si busca CVs con características específicas → intent: "buscar_cv"
        3. Si busca por contenido o palabras clave → intent: "buscar_contenido"
        4. Si busca por precio/monto → intent: "buscar_por_precio"

        ATRIBUTOS DE CV:
        - edad_min/edad_max: rango de edad del candidato
        - experiencia_min/experiencia_max: años de experiencia (en años)
        - habilidades: lista de skills buscadas
        - educacion_nivel: secundaria, tecnico, universitario, posgrado
        - idiomas: lista de idiomas requeridos

        Responde SOLO con este JSON:

        {{
            "intent": "listar_todos" | "buscar_contenido" | "buscar_cv" | "buscar_por_precio" | "general",
            "filters": {{
                "search_phrase": "frase o palabras clave del usuario",
                "tipo_documento": "cv" | "factura" | "boleta" | "contrato" | "carta" | "reporte" | null,
                
                // Filtros financieros
                "precio_min": null o número,
                "precio_max": null o número,
                "precio_type": "total_documento" | "item_individual" | null,
                "moneda": "PEN" | "USD" | "EUR" | null,
                
                // Filtros de CV
                "edad_min": null o número,
                "edad_max": null o número,
                "experiencia_min": null o número (en años),
                "experiencia_max": null o número (en años),
                "habilidades": ["lista", "de", "skills"] o null,
                "educacion_nivel": null o string,
                "idiomas": ["lista", "de", "idiomas"] o null,
                
                // Generales
                "date_range": "YYYY-MM-DD TO YYYY-MM-DD" o null,
                "keywords": ["lista", "de", "palabras", "clave"],
                "search_in_content": true
            }},
            "search_type": "fulltext" | "fuzzy" | "exact",
            "description": "Descripción breve de qué busca"
        }}

        EJEMPLOS:

        "dame CVs de personas con poca experiencia entre 18 y 20 años"
        → {{
            "intent": "buscar_cv",
            "filters": {{
                "search_phrase": "cv poca experiencia",
                "tipo_documento": "cv",
                "edad_min": 18,
                "edad_max": 20,
                "experiencia_min": 0,
                "experiencia_max": 2,
                "keywords": ["cv", "experiencia"],
                "search_in_content": true
            }},
            "search_type": "fulltext",
            "description": "Buscar CVs de jóvenes con poca experiencia laboral"
        }}

        "busca CVs de desarrolladores Python senior"
        → {{
            "intent": "buscar_cv",
            "filters": {{
                "search_phrase": "desarrollador python senior",
                "tipo_documento": "cv",
                "habilidades": ["python", "desarrollo", "programación"],
                "experiencia_min": 5,
                "keywords": ["python", "desarrollador", "senior"],
                "search_in_content": true
            }},
            "search_type": "fulltext",
            "description": "Buscar CVs de desarrolladores Python con experiencia"
        }}

        "facturas entre 80 y 100 soles"
        → {{
            "intent": "buscar_por_precio",
            "filters": {{
                "search_phrase": null,
                "tipo_documento": "factura",
                "precio_min": 80,
                "precio_max": 100,
                "moneda": "PEN",
                "search_in_content": false
            }},
            "search_type": "exact",
            "description": "Facturas con monto entre 80 y 100 PEN"
        }}

        "todos los documentos"
        → {{
            "intent": "listar_todos",
            "filters": {{"search_phrase": null, "search_in_content": false}},
            "search_type": "all",
            "description": "Listar todos los documentos"
        }}

        Responde SOLO el JSON sin texto adicional.
        """
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            response_text = response.text.strip()
            
            # Limpiar markdown
            response_text = re.sub(
                r'^```json\s*|\s*```$', 
                '', 
                response_text, 
                flags=re.MULTILINE
            ).strip()
            
            search_criteria = json.loads(response_text)
            
            # Post-procesamiento: construir search_phrase desde keywords si no existe
            if not search_criteria['filters'].get('search_phrase') and \
               search_criteria['filters'].get('keywords'):
                search_criteria['filters']['search_phrase'] = ' '.join(
                    search_criteria['filters']['keywords']
                )
            
            # Activar búsqueda en contenido para búsquedas relevantes
            if search_criteria.get('intent') in ['buscar_contenido', 'buscar_cv', 'general']:
                search_criteria['filters']['search_in_content'] = True
                if not search_criteria.get('search_type'):
                    search_criteria['search_type'] = 'fulltext'
            
            return search_criteria
            
        except Exception as e:
            return self._get_fallback_search(user_query)
    
    # Sistema de respaldo cuando falla la IA
    def _get_fallback_search(self, query: str = "") -> Dict[str, Any]:
        """
        Análisis de búsqueda basado en regex cuando Gemini no está disponible.
        Detecta patrones comunes: tipo de documento, rangos de precio, edad, etc.
        """
        query_lower = query.lower().strip()
        
        # Listar todos
        if not query or any(word in query_lower for word in ["todos", "todo", "listar", "mostrar todo"]):
            return {
                "intent": "listar_todos",
                "filters": {"search_phrase": None, "search_in_content": False},
                "search_type": "all",
                "description": "Listar todos los documentos"
            }
        
        filters = {
            "search_phrase": query,
            "precio_min": None,
            "precio_max": None,
            "precio_type": None,
            "moneda": None,
            "tipo_documento": None,
            "date_range": None,
            "keywords": query_lower.split(),
            "search_in_content": True,
            "edad_min": None,
            "edad_max": None,
            "experiencia_min": None,
            "experiencia_max": None,
            "habilidades": None,
            "educacion_nivel": None,
            "idiomas": None,
        }
        
        # Detectar tipo de documento
        for doc_type, keywords in self.document_types.items():
            if any(kw in query_lower for kw in keywords):
                filters["tipo_documento"] = doc_type
                break
        
        # Detectar búsqueda de CV
        if any(term in query_lower for term in ['cv', 'curriculum', 'curriculo', 'resume', 'hoja de vida']):
            filters["tipo_documento"] = "cv"
            
            # Extraer edad
            edad_match = re.search(r'(\d+)\s*(?:a|y)\s*(\d+)\s*año', query_lower)
            if edad_match:
                filters["edad_min"] = int(edad_match.group(1))
                filters["edad_max"] = int(edad_match.group(2))
            
            # Detectar nivel de experiencia
            if any(term in query_lower for term in ['sin experiencia', 'poca experiencia', 'junior']):
                filters["experiencia_min"] = 0
                filters["experiencia_max"] = 2
            elif 'senior' in query_lower:
                filters["experiencia_min"] = 5
        
        # Detectar documentos financieros
        if "factura" in query_lower:
            filters["tipo_documento"] = "factura"
        elif "boleta" in query_lower:
            filters["tipo_documento"] = "boleta"
        
        # Moneda
        if any(word in query_lower for word in ["dolar", "usd", "$"]):
            filters["moneda"] = "USD"
        elif any(word in query_lower for word in ["sol", "pen", "s/"]):
            filters["moneda"] = "PEN"
        
        # Rango de precios
        match = re.search(r'entre\s+(\d+(?:\.\d+)?)\s+(?:y|a)\s+(\d+(?:\.\d+)?)', query_lower)
        if match:
            filters["precio_min"] = float(match.group(1))
            filters["precio_max"] = float(match.group(2))
            filters["precio_type"] = "total_documento"
        
        intent = "buscar_cv" if filters["tipo_documento"] == "cv" else "buscar_contenido"
        
        return {
            "intent": intent,
            "filters": filters,
            "search_type": "fulltext",
            "description": f"Búsqueda de contenido: {query}"
        }
    
    # Expande la búsqueda con sinónimos para mejorar recall
    def expand_query_with_synonyms(self, query: str) -> List[str]:
        """Agrega sinónimos a los términos de búsqueda para encontrar más resultados"""
        if not query:
            return []
        
        words = query.lower().split()
        expanded = set(words)
        
        for word in words:
            if word in self.synonyms:
                expanded.update(self.synonyms[word])
        
        return list(expanded)
    
    # Algoritmo de distancia de Levenshtein para fuzzy matching
    def calculate_levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calcula cuántos caracteres difieren entre dos strings (para búsqueda tolerante a errores)"""
        if len(s1) < len(s2):
            return self.calculate_levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    # Búsqueda tolerante a errores de escritura
    def fuzzy_match(self, search_term: str, text: str, threshold: int = 2) -> bool:
        """
        Verifica si search_term aparece en text, tolerando errores de tipeo.
        Útil para encontrar "desarollo" cuando se busca "desarrollo"
        """
        if not search_term or not text:
            return False
        
        search_lower = search_term.lower()
        text_lower = text.lower()
        
        if search_lower in text_lower:
            return True
        
        search_words = search_lower.split()
        text_words = text_lower.split()
        
        for search_word in search_words:
            if len(search_word) < 3:
                if search_word in text_lower:
                    continue
                else:
                    return False
            
            found = False
            for text_word in text_words:
                distance = self.calculate_levenshtein_distance(search_word, text_word)
                max_distance = min(threshold, len(search_word) // 3)
                
                if distance <= max_distance:
                    found = True
                    break
            
            if not found:
                return False
        
        return True
    
    # Normaliza texto para comparación (quita acentos, minúsculas, etc.)
    def normalize_text(self, text):
        """Convierte texto a formato estándar para comparación: sin acentos, lowercase, etc."""
        if not text:
            return ""
        text = str(text).lower()
        text = re.sub(r'[áàäâ]', 'a', text)
        text = re.sub(r'[éèëê]', 'e', text)
        text = re.sub(r'[íìïî]', 'i', text)
        text = re.sub(r'[óòöô]', 'o', text)
        text = re.sub(r'[úùüû]', 'u', text)
        text = re.sub(r'[ñ]', 'n', text)
        text = re.sub(r'[^\w\s]', ' ', text)
        text = " ".join(text.split())
        return text
    
    # Búsqueda en texto completo con scoring
    def search_with_fulltext(self, search_phrase: str, keywords: List[str], 
                            extracted_text: str, summary: Dict, 
                            metadata: Dict, tags: List, items: List) -> Tuple[bool, int, List[str]]:
        """
        Busca términos en todos los campos del documento y asigna un score.
        Campos más importantes (como metadata) tienen mayor peso en el score.
        """
        score = 0
        matches = []
        found = False
        
        expanded_keywords = set(keywords) if keywords else set()
        if search_phrase:
            expanded_keywords.update(self.expand_query_with_synonyms(search_phrase))
        
        # Lista de campos buscables con sus pesos
        all_searchable_text = []
        
        if extracted_text:
            all_searchable_text.append(("texto extraído", extracted_text, 50))
        
        if summary and isinstance(summary, dict):
            summary_text = summary.get('summary', '')
            if summary_text:
                all_searchable_text.append(("resumen", summary_text, 40))
        
        if metadata and isinstance(metadata, dict):
            for key, value in metadata.items():
                if key in ['issuer', 'receiver', 'invoice_number', 'ruc', 'document_type']:
                    all_searchable_text.append((f"metadata.{key}", str(value), 30))
        
        if tags and isinstance(tags, list):
            for tag_obj in tags:
                tag_text = tag_obj.get('tag', '') if isinstance(tag_obj, dict) else str(tag_obj)
                if tag_text:
                    all_searchable_text.append(("tag", tag_text, 25))
        
        if items and isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    item_name = item.get('name', '')
                    item_type = item.get('type', '')
                    if item_name:
                        all_searchable_text.append(("item", f"{item_name} {item_type}", 35))
        
        # Buscar en cada campo
        for source, text, base_score in all_searchable_text:
            text_normalized = self.normalize_text(text)
            
            # Búsqueda exacta de la frase
            if search_phrase:
                search_normalized = self.normalize_text(search_phrase)
                
                if search_normalized in text_normalized:
                    count = text_normalized.count(search_normalized)
                    boost = min(count * 5, 20)
                    score += base_score + boost
                    matches.append(f"Exacto en {source}")
                    found = True
                elif self.fuzzy_match(search_phrase, text, threshold=2):
                    score += base_score // 2
                    matches.append(f"Fuzzy en {source}")
                    found = True
            
            # Búsqueda de keywords individuales
            if expanded_keywords:
                keyword_matches = 0
                for keyword in expanded_keywords:
                    keyword_norm = self.normalize_text(keyword)
                    if len(keyword_norm) >= 3:
                        if keyword_norm in text_normalized:
                            keyword_matches += 1
                        elif self.fuzzy_match(keyword, text, threshold=1):
                            keyword_matches += 0.5
                
                if keyword_matches > 0:
                    score += int(keyword_matches * (base_score // 4))
                    if keyword_matches >= len(expanded_keywords) * 0.5:
                        found = True
                        matches.append(f"✓ Keywords en {source} ({int(keyword_matches)} matches)")
        
        return (found, score, matches)
    
    # Valida si un documento cumple todos los filtros aplicados
    def document_passes_filters(self, doc: Dict, filters: Dict, 
                                start_date_obj: Any, end_date_obj: Any) -> tuple:
        """
        Evalúa si un documento cumple con todos los filtros (tipo, fecha, precio, contenido).
        Retorna (passed, score, matches, debug_info)
        """
        score = 0
        matches = []
        debug_info = {}
        
        metadata = doc.get('metadata', {}) or {}
        items = doc.get('items', []) or []
        tags = doc.get('tags', []) or []
        summary = doc.get('summary', {}) or {}
        extracted_text = doc.get('extracted_text', '') or ''
        
        # Filtro de tipo de documento
        tipo_documento = filters.get("tipo_documento")
        if tipo_documento:
            doc_type = metadata.get('document_type', '').lower()
            if doc_type and doc_type != tipo_documento.lower():
                debug_info['rejected_reason'] = f"Tipo incorrecto: {doc_type} != {tipo_documento}"
                return (False, 0, [], debug_info)
            if doc_type == tipo_documento.lower():
                score += 25
                matches.append(f"✓ Tipo: {tipo_documento}")
        
        # Filtro de rango de fechas
        if start_date_obj and end_date_obj:
            doc_date_str = metadata.get('date')
            if doc_date_str:
                try:
                    doc_dt = datetime.strptime(str(doc_date_str)[:10], "%Y-%m-%d")
                    if start_date_obj <= doc_dt <= end_date_obj:
                        score += 30
                        matches.append(f"✓ Fecha: {doc_date_str}")
                    else:
                        debug_info['rejected_reason'] = f"Fecha fuera de rango: {doc_date_str}"
                        return (False, 0, [], debug_info)
                except ValueError:
                    pass
        
        # Filtro de precio (total del documento o items individuales)
        precio_min = filters.get("precio_min")
        precio_max = filters.get("precio_max")
        precio_type = filters.get("precio_type")
        moneda_filtro = filters.get("moneda")
        
        price_filter_applied = False
        
        if precio_min is not None or precio_max is not None:
            price_filter_applied = True
            min_val = precio_min if precio_min is not None else 0
            max_val = precio_max if precio_max is not None else float('inf')
            
            price_match = False
            
            # Buscar en total del documento
            if precio_type == "total_documento" or precio_type is None:
                doc_total = metadata.get('total_amount')
                doc_currency = metadata.get('currency', 'PEN')
                
                if doc_total is not None and doc_total != '':
                    try:
                        doc_total_float = float(doc_total)
                        currency_match = True
                        if moneda_filtro:
                            currency_match = doc_currency.upper() == moneda_filtro.upper()
                        
                        if currency_match and min_val <= doc_total_float <= max_val:
                            score += 40
                            matches.append(f"✓ Total: {doc_total_float} {doc_currency}")
                            price_match = True
                    except (ValueError, TypeError):
                        pass
            
            # Buscar en items individuales si no se encontró en el total
            if (precio_type == "item_individual" or not price_match) and isinstance(items, list):
                search_phrase = filters.get("search_phrase")
                
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    
                    if search_phrase:
                        item_name = item.get("name", "")
                        if not self.fuzzy_match(search_phrase, item_name, threshold=2):
                            continue
                    
                    item_price = item.get("total_price") or item.get("unit_price")
                    if item_price is None:
                        continue
                    
                    try:
                        item_price_float = float(item_price)
                        item_currency = item.get("currency", metadata.get('currency', 'PEN'))
                        
                        currency_match = True
                        if moneda_filtro:
                            currency_match = item_currency.upper() == moneda_filtro.upper()
                        
                        if currency_match and min_val <= item_price_float <= max_val:
                            score += 35
                            matches.append(f"Item: {item.get('name', 'Sin nombre')} - {item_price_float} {item_currency}")
                            price_match = True
                            break
                    except (ValueError, TypeError):
                        continue
            
            if not price_match:
                debug_info['rejected_reason'] = f"Precio fuera de rango {min_val}-{max_val}"
                return (False, 0, [], debug_info)
        
        # Filtro de contenido (búsqueda fulltext)
        search_phrase = filters.get("search_phrase")
        keywords = filters.get("keywords", [])
        search_in_content = filters.get("search_in_content", True)
        
        if search_phrase or keywords:
            if search_in_content:
                found, content_score, content_matches = self.search_with_fulltext(
                    search_phrase, keywords, extracted_text, summary, metadata, tags, items
                )
                
                if found:
                    score += content_score
                    matches.extend(content_matches)
                elif not price_filter_applied:
                    debug_info['rejected_reason'] = "No se encontró el contenido buscado"
                    debug_info['search_phrase'] = search_phrase
                    debug_info['keywords'] = keywords
                    return (False, 0, [], debug_info)
        
        if score == 0 and (search_phrase or keywords) and not price_filter_applied:
            debug_info['rejected_reason'] = "Sin coincidencias relevantes"
            return (False, 0, [], debug_info)
        
        debug_info['passed'] = True
        return (True, max(score, 1), matches, debug_info)
    
    # Ejecuta la búsqueda en base de datos y aplica filtros
    async def search_documents_multi_table(
            self, 
            search_criteria: Dict[str, Any]
        ) -> List[Dict[str, Any]]:
        """
        Query principal: obtiene documentos de BD y filtra según criterios.
        Retorna lista de resultados con score y matches.
        """
        filters = search_criteria.get("filters", {})
        
        # Parsear rango de fechas
        date_range_str = filters.get("date_range")
        start_date_obj = None
        end_date_obj = None
        
        if date_range_str:
            try:
                parts = date_range_str.split(" TO ")
                if len(parts) == 2:
                    start_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    end_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
            except Exception as e:
                pass
        
        # Query: obtener todos los documentos
        query = self.supabase.table('documents').select(
            'id, filename, metadata, tags, items, summary, extracted_text, '
            'visual_features, detected_objects, layout_analysis'
        )
        
        result = query.execute()
        
        valid_documents = []
        rejected_count = 0
        
        # Aplicar filtros a cada documento
        for doc in result.data:
            passed, score, matches, debug_info = self.document_passes_filters(
                doc, filters, start_date_obj, end_date_obj
            )
            
            if passed and score > 0:
                valid_documents.append({
                    "document_id": doc["id"],
                    "filename": doc.get("filename"),
                    "score": score,
                    "matches": list(set(matches))[:10],
                    "match_count": len(set(matches)),
                    "debug": debug_info
                })
            else:
                rejected_count += 1
        
        # Ordenar por relevancia
        valid_documents.sort(key=lambda x: x["score"], reverse=True)
        
        return valid_documents[:50]
    
    # Punto de entrada principal para búsquedas
    async def search_documents(
        self, 
        search_criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Función principal de búsqueda.
        Recibe criterios estructurados y retorna documentos completos ordenados por relevancia.
        """
        # Ejecutar búsqueda
        search_results = await self.search_documents_multi_table(search_criteria)
        
        if not search_results:
            return []
        
        # Obtener documentos completos
        doc_ids = [r["document_id"] for r in search_results]
        docs = self.supabase.table("documents").select("*").in_("id", doc_ids).execute()
        
        # Combinar documentos con sus scores
        score_map = {r["document_id"]: r for r in search_results}
        results = []
        
        for doc in docs.data:
            doc_id = doc["id"]
            if doc_id in score_map:
                results.append({
                    "document": doc,
                    "score": score_map[doc_id]["score"],
                    "matches": score_map[doc_id]["matches"],
                    "match_count": score_map[doc_id]["match_count"]
                })
        
        # Ordenar por score final
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results