from flask import Blueprint, request, jsonify
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
import sys

chatbot_bp = Blueprint("chatbot", __name__)

# ✅ Cấu hình Google API Key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyDsRaR1V6nrWl5gVrcv4UrRSMdk6FTMpTs")
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# ✅ Fix UTF-8 encoding cho Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

# ✅ Khởi tạo RAG model (lazy loading)
_retrieval_chain = None

def get_retrieval_chain():
    """Lazy load RAG model"""
    global _retrieval_chain
    
    if _retrieval_chain is None:
        print("🔄 Đang load RAG model...")
        
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=GOOGLE_API_KEY
        )
        
        vector_db = Chroma(
            persist_directory="./new_chroma_food_db",
            embedding_function=embeddings
        )
        
        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.0-flash",
            temperature=0.2
        )
        
        custom_prompt = ChatPromptTemplate.from_messages([
            ("system", """Bạn là trợ lý ẩm thực Việt Nam thông minh và thân thiện. 
Nhiệm vụ của bạn là trả lời câu hỏi về món ăn Việt Nam dựa trên thông tin được cung cấp.

Thông tin từ database:
{context}

HƯỚNG DẪN TRẢ LỜI:
1. Trả lời bằng tiếng Việt tự nhiên, dễ hiểu
2. Dựa vào context được cung cấp để trả lời chính xác
3. Nếu có nhiều món ăn/công thức phù hợp, liệt kê rõ ràng
4. Nếu không tìm thấy thông tin trong context, hãy nói rõ: "Tôi không tìm thấy thông tin về điều này trong database."
5. Khi nói về thời gian nấu, hãy chỉ rõ thời gian chuẩn bị và thời gian nấu
6. Khi nói về nguyên liệu, hãy trình bày dưới dạng danh sách dễ đọc

ĐỊNH DẠNG TRÌNH BÀY:
- Với danh sách món ăn: Dùng bullet points hoặc đánh số
- Với công thức: Trình bày theo từng bước rõ ràng
- Với thông tin dinh dưỡng: Hiển thị dạng key-value
- Nếu không hỏi tới cách nấu ăn với dinh dưỡng thì không trả lời về phần này

Hãy trả lời một cách thân thiện, chuyên nghiệp và hữu ích!"""),
            ("human", "{input}")
        ])
        
        document_chain = create_stuff_documents_chain(llm, custom_prompt)
        _retrieval_chain = create_retrieval_chain(
            vector_db.as_retriever(search_kwargs={"k": 5}),
            document_chain
        )
        
        print("✅ RAG model đã sẵn sàng!")
    
    return _retrieval_chain


# ===== API ROUTES =====

@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    """
    Chat endpoint
    Request body:
    {
        "question": "Món nào có vị chua cay?",
        "k": 5  // Optional: số documents retrieve
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'question' not in data:
            return jsonify({
                "error": "Missing 'question' field in request body"
            }), 400
        
        question = data['question'].strip()
        k = data.get('k', 5)  # Mặc định lấy 5 documents
        
        if not question:
            return jsonify({
                "error": "Question cannot be empty"
            }), 400
        
        print(f"📩 Nhận câu hỏi: {question}")
        
        # Gọi RAG chain
        retrieval_chain = get_retrieval_chain()
        result = retrieval_chain.invoke({"input": question})
        
        # Format response
        sources = []
        for doc in result['context']:
            sources.append({
                "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "metadata": doc.metadata
            })
        
        response = {
            "question": question,
            "answer": result['answer'],
            "sources": sources,
            "num_sources": len(sources)
        }
        
        print(f"✅ Trả lời thành công")
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@chatbot_bp.route("/chat/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        # Kiểm tra xem model đã được load chưa
        is_loaded = _retrieval_chain is not None
        
        return jsonify({
            "status": "healthy",
            "model_loaded": is_loaded,
            "google_api_key_set": bool(GOOGLE_API_KEY)
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
