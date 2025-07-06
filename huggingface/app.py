import gradio as gr
import requests
import os
from typing import Optional
import json

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "https://your-backend-url.com")
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")

class IntelligentCodingAssistant:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {HUGGING_FACE_TOKEN}" if HUGGING_FACE_TOKEN else ""
        })
    
    def generate_code(self, description: str, language: str = "python", style: str = "clean") -> str:
        """Generate code from natural language description"""
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/v1/generate",
                json={
                    "description": description,
                    "language": language,
                    "style": style,
                    "max_tokens": 500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("generated_code", "Error generating code")
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def explain_code(self, code: str, language: str = "python") -> str:
        """Explain code functionality"""
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/v1/explain",
                json={
                    "code": code,
                    "language": language,
                    "detail_level": "detailed"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("explanation", "Error explaining code")
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def refactor_code(self, code: str, language: str = "python", goals: list = None) -> str:
        """Refactor code with improvements"""
        if goals is None:
            goals = ["Improve readability", "Optimize performance"]
            
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/v1/refactor",
                json={
                    "code": code,
                    "language": language,
                    "goals": goals,
                    "preserve_functionality": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                refactored_code = result.get("refactored_code", "")
                improvements = result.get("improvements", [])
                
                output = f"**Refactored Code:**\n```{language}\n{refactored_code}\n```\n\n"
                output += "**Improvements Made:**\n"
                for i, improvement in enumerate(improvements, 1):
                    output += f"{i}. {improvement}\n"
                
                return output
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_tests(self, code: str, language: str = "python", framework: str = "pytest") -> str:
        """Generate unit tests for code"""
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/v1/test",
                json={
                    "code": code,
                    "language": language,
                    "test_framework": framework,
                    "test_types": ["unit", "integration"]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("test_code", "Error generating tests")
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"

# Initialize the assistant
assistant = IntelligentCodingAssistant()

# Gradio Interface Functions
def generate_code_interface(description, language, style):
    if not description.strip():
        return "Please provide a description of the code you want to generate."
    
    result = assistant.generate_code(description, language, style)
    return f"```{language}\n{result}\n```"

def explain_code_interface(code, language):
    if not code.strip():
        return "Please provide code to explain."
    
    return assistant.explain_code(code, language)

def refactor_code_interface(code, language, goals_text):
    if not code.strip():
        return "Please provide code to refactor."
    
    goals = [goal.strip() for goal in goals_text.split(",") if goal.strip()]
    if not goals:
        goals = ["Improve readability", "Optimize performance"]
    
    return assistant.refactor_code(code, language, goals)

def generate_tests_interface(code, language, framework):
    if not code.strip():
        return "Please provide code to generate tests for."
    
    result = assistant.generate_tests(code, language, framework)
    return f"```{language}\n{result}\n```"

# Create Gradio Interface
with gr.Blocks(
    title="🤖 Intelligent Coding Assistant",
    theme=gr.themes.Soft(),
    css="""
    .gradio-container {
        max-width: 1200px !important;
    }
    .tab-nav {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }
    """
) as demo:
    
    gr.Markdown("""
    # 🤖 Intelligent Coding Assistant
    
    **AI-powered coding assistant that helps you generate, explain, refactor, and test code.**
    
    ⭐ **Features:**
    - 🚀 Natural language to code generation
    - 📖 Code explanation and documentation
    - 🔧 Smart refactoring suggestions
    - 🧪 Automated test generation
    - 🎯 Multi-language support
    
    ---
    """)
    
    with gr.Tabs():
        # Code Generation Tab
        with gr.Tab("🚀 Generate Code"):
            gr.Markdown("### Generate code from natural language descriptions")
            
            with gr.Row():
                with gr.Column(scale=2):
                    gen_description = gr.Textbox(
                        label="Describe what you want to build",
                        placeholder="e.g., Create a function to sort a list of dictionaries by a specific key",
                        lines=3
                    )
                    
                with gr.Column(scale=1):
                    gen_language = gr.Dropdown(
                        choices=["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust"],
                        value="python",
                        label="Programming Language"
                    )
                    gen_style = gr.Dropdown(
                        choices=["clean", "functional", "object-oriented", "minimal", "documented"],
                        value="clean",
                        label="Code Style"
                    )
            
            gen_button = gr.Button("Generate Code", variant="primary")
            gen_output = gr.Markdown(label="Generated Code")
            
            gen_button.click(
                generate_code_interface,
                inputs=[gen_description, gen_language, gen_style],
                outputs=gen_output
            )
        
        # Code Explanation Tab
        with gr.Tab("📖 Explain Code"):
            gr.Markdown("### Get detailed explanations of your code")
            
            with gr.Row():
                with gr.Column(scale=3):
                    explain_code = gr.Code(
                        label="Paste your code here",
                        language="python",
                        lines=10
                    )
                    
                with gr.Column(scale=1):
                    explain_language = gr.Dropdown(
                        choices=["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust"],
                        value="python",
                        label="Programming Language"
                    )
            
            explain_button = gr.Button("Explain Code", variant="primary")
            explain_output = gr.Markdown(label="Code Explanation")
            
            explain_button.click(
                explain_code_interface,
                inputs=[explain_code, explain_language],
                outputs=explain_output
            )
        
        # Code Refactoring Tab
        with gr.Tab("🔧 Refactor Code"):
            gr.Markdown("### Improve your code with AI-powered refactoring")
            
            with gr.Row():
                with gr.Column(scale=2):
                    refactor_code = gr.Code(
                        label="Code to refactor",
                        language="python",
                        lines=10
                    )
                    
                with gr.Column(scale=1):
                    refactor_language = gr.Dropdown(
                        choices=["python", "javascript", "typescript", "java", "cpp", "c", "go", "rust"],
                        value="python",
                        label="Programming Language"
                    )
                    refactor_goals = gr.Textbox(
                        label="Refactoring Goals (comma-separated)",
                        placeholder="Improve readability, Optimize performance, Add error handling",
                        value="Improve readability, Optimize performance"
                    )
            
            refactor_button = gr.Button("Refactor Code", variant="primary")
            refactor_output = gr.Markdown(label="Refactored Code & Improvements")
            
            refactor_button.click(
                refactor_code_interface,
                inputs=[refactor_code, refactor_language, refactor_goals],
                outputs=refactor_output
            )
        
        # Test Generation Tab
        with gr.Tab("🧪 Generate Tests"):
            gr.Markdown("### Automatically generate unit tests for your code")
            
            with gr.Row():
                with gr.Column(scale=2):
                    test_code = gr.Code(
                        label="Code to test",
                        language="python",
                        lines=10
                    )
                    
                with gr.Column(scale=1):
                    test_language = gr.Dropdown(
                        choices=["python", "javascript", "typescript", "java", "cpp", "c"],
                        value="python",
                        label="Programming Language"
                    )
                    test_framework = gr.Dropdown(
                        choices=["pytest", "unittest", "jest", "mocha", "junit", "gtest"],
                        value="pytest",
                        label="Test Framework"
                    )
            
            test_button = gr.Button("Generate Tests", variant="primary")
            test_output = gr.Markdown(label="Generated Tests")
            
            test_button.click(
                generate_tests_interface,
                inputs=[test_code, test_language, test_framework],
                outputs=test_output
            )
    
    # Footer
    gr.Markdown("""
    ---
    
    ### 💡 **Want More Features?**
    
    🔥 **Upgrade to Pro** for:
    - Unlimited requests
    - Advanced refactoring
    - Custom models
    - Priority support
    - VS Code extension
    
    [**Get Pro Access →**](https://your-payment-link.com)
    
    ---
    
    Made with ❤️ using [Gradio](https://gradio.app) | [GitHub](https://github.com/your-repo) | [Documentation](https://your-docs.com)
    """)

# Launch the app
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True,
        show_error=True
    )
