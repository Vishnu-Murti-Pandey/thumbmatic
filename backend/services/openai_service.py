import base64
from openai import AsyncOpenAI

from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

async def generate_thumbnail(prompt: str, style_prompt: str, headshot_url: str) -> bytes:
    """
        Use the response api with gpt-image-1 as built-in image generation tool.
        Pass the headshot url directly as an input_image.
        Returns raw PNG bytes.
    """
    
    full_prompt = f"""
        {style_prompt}

        Create a viral YouTube thumbnail.

        User request:
        {prompt}

        Use the uploaded image as inspiration for the character appearance.
        Do not exactly replicate the real person's face.

        Make it:
        - cinematic
        - high contrast
        - expressive
        - ultra detailed
        - clickworthy
        """
    
    response = await client.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_image",
                        "image_url": headshot_url
                    },
                    {
                        "type": "input_text",
                        "text": full_prompt
                    }
                ]
            }
        ],
        tools=[
            {
                "type": "image_generation",
                "model": "gpt-image-2",
                "size": "1024x1024",
                "quality": "low",
                "output_format": "png"
            }
        ]
    )
    
    for item in response.output:
        if hasattr(item, "result") and item.result:
            return base64.b64decode(item.result)

        if hasattr(item, "content"):
            for content in item.content:
                if hasattr(content, "image_base64"):
                    return base64.b64decode(content.image_base64)

    raise RuntimeError("No image generation result found in this response")
            