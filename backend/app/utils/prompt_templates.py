"""
Prompt templates for different AI operations
"""
from typing import List, Dict, Any, Optional

class PromptTemplates:
    """Collection of prompt templates for various coding tasks"""
    
    def code_generation_prompt(
        self,
        description: str,
        language: str,
        context: str = "",
        style: str = "clean",
        additional_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for code generation"""
        base_prompt = f"""You are an expert {language} developer. Generate high-quality, {style} code based on the following description.

Description: {description}

Language: {language}
Style: {style}

Requirements:
- Write clean, readable, and well-documented code
- Follow {language} best practices and conventions
- Include appropriate error handling
- Add helpful comments where necessary
- Ensure the code is production-ready

"""
        
        if context:
            base_prompt += f"""
Relevant Context:
{context}

"""
        
        if additional_context:
            if additional_context.get("imports"):
                base_prompt += f"Required imports: {', '.join(additional_context['imports'])}\n"
            if additional_context.get("constraints"):
                base_prompt += f"Constraints: {', '.join(additional_context['constraints'])}\n"
        
        base_prompt += f"""
Generate the {language} code:

```{language}
"""
        
        return base_prompt
    
    def code_explanation_prompt(
        self,
        code: str,
        language: str,
        structure: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for code explanation"""
        prompt = f"""You are an expert {language} developer. Explain the following code in a clear and comprehensive way.

Code to explain:
```{language}
{code}
```

Code structure detected:
- Functions: {', '.join(structure.get('functions', []))}
- Classes: {', '.join(structure.get('classes', []))}
- Imports: {', '.join(structure.get('imports', []))}

Please provide:
1. **Overview**: What does this code do?
2. **Key Components**: Explain main functions/classes
3. **Logic Flow**: How does the code work step by step?
4. **Dependencies**: What external libraries or modules are used?
5. **Potential Issues**: Any concerns or improvements?

Explanation:
"""
        
        return prompt
    
    def code_refactoring_prompt(
        self,
        code: str,
        language: str,
        goals: List[str],
        structure: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for code refactoring"""
        goals_text = ", ".join(goals)
        
        prompt = f"""You are an expert {language} developer. Refactor the following code to achieve these goals: {goals_text}

Original code:
```{language}
{code}
```

Current structure:
- Functions: {', '.join(structure.get('functions', []))}
- Classes: {', '.join(structure.get('classes', []))}

Refactoring goals: {goals_text}

Please provide:
1. **Refactored Code**: The improved version
2. **Improvements Made**: List of specific improvements
3. **Rationale**: Why these changes improve the code

Refactored code:
```{language}
"""
        
        return prompt
    
    def test_generation_prompt(
        self,
        code: str,
        language: str,
        test_framework: str,
        structure: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for test generation"""
        prompt = f"""You are an expert {language} developer. Generate comprehensive test cases for the following code using {test_framework}.

Code to test:
```{language}
{code}
```

Functions to test: {', '.join(structure.get('functions', []))}
Classes to test: {', '.join(structure.get('classes', []))}

Test requirements:
- Use {test_framework} framework
- Cover normal cases, edge cases, and error cases
- Include setup and teardown if needed
- Add descriptive test names and comments
- Ensure good test coverage

Generate the test code:
```{language}
"""
        
        return prompt
    
    def debug_prompt(
        self,
        code: str,
        error_message: Optional[str],
        language: str,
        structure: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for debugging"""
        prompt = f"""You are an expert {language} debugger. Analyze the following code and help fix the issue.

Code with issue:
```{language}
{code}
```

"""
        
        if error_message:
            prompt += f"""Error message:
{error_message}

"""
        
        prompt += f"""Code structure:
- Functions: {', '.join(structure.get('functions', []))}
- Classes: {', '.join(structure.get('classes', []))}

Please provide:
1. **Problem Analysis**: What's causing the issue?
2. **Root Cause**: Why is this happening?
3. **Solution**: How to fix it?
4. **Prevention**: How to avoid similar issues?

If possible, provide the corrected code:
```{language}
"""
        
        return prompt
    
    def chat_prompt(
        self,
        message: str,
        context: str = "",
        conversation_history: List[Dict[str, str]] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate prompt for chat interactions"""
        prompt = """You are an intelligent coding assistant. You help developers with code-related questions, explanations, debugging, and best practices.

"""
        
        if conversation_history:
            prompt += "Previous conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                prompt += f"{role.capitalize()}: {content}\n"
            prompt += "\n"
        
        if context:
            prompt += f"""Current code context:
```
{context}
```

"""
        
        if additional_context:
            if additional_context.get("current_file"):
                prompt += f"Current file: {additional_context['current_file']}\n"
            if additional_context.get("project_info"):
                prompt += f"Project info: {additional_context['project_info']}\n"
        
        prompt += f"""User question: {message}

Please provide a helpful, accurate, and concise response. If the question involves code, provide examples when appropriate.

Response:
"""
        
        return prompt
    
    def code_completion_prompt(
        self,
        before_cursor: str,
        after_cursor: str,
        language: str
    ) -> str:
        """Generate prompt for code completion"""
        prompt = f"""You are an expert {language} developer providing code completion suggestions.

Code before cursor:
```{language}
{before_cursor}
```

Code after cursor:
```{language}
{after_cursor}
```

Provide 1-3 most likely completions for the current cursor position. Consider:
- Context and variable names
- Function signatures and patterns
- {language} syntax and conventions
- Common programming patterns

Completions (one per line):
"""
        
        return prompt
    
    def optimization_prompt(
        self,
        code: str,
        language: str,
        goals: List[str],
        constraints: List[str] = None
    ) -> str:
        """Generate prompt for code optimization"""
        goals_text = ", ".join(goals)
        constraints_text = ", ".join(constraints) if constraints else "None"
        
        prompt = f"""You are an expert {language} performance engineer. Optimize the following code for: {goals_text}

Original code:
```{language}
{code}
```

Optimization goals: {goals_text}
Constraints: {constraints_text}

Please provide:
1. **Optimized Code**: The improved version
2. **Performance Improvements**: Specific optimizations made
3. **Trade-offs**: Any trade-offs or considerations
4. **Benchmarking**: How to measure the improvements

Optimized code:
```{language}
"""
        
        return prompt
    
    def documentation_prompt(
        self,
        code: str,
        language: str,
        doc_style: str = "google",
        include_examples: bool = True
    ) -> str:
        """Generate prompt for documentation generation"""
        prompt = f"""You are an expert technical writer. Generate comprehensive documentation for the following {language} code using {doc_style} style.

Code to document:
```{language}
{code}
```

Documentation requirements:
- Use {doc_style} docstring style
- Include parameter descriptions and types
- Add return value descriptions
- Include usage examples{'if appropriate' if include_examples else ''}
- Add any relevant notes or warnings

Generate the documented code:
```{language}
"""
        
        return prompt
