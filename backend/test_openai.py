import asyncio
from services.openai_service import generate_thumbnail

async def main():
    image_bytes = await generate_thumbnail(
        prompt="Create a viral hiking thumbnail in snowy mountains",
        style_prompt="Bold dramatic YouTube style",
        headshot_url="https://ik.imagekit.io/vmpandey/headshots/mountain1_16wD3X43v.png"
    )

    with open("output.png", "wb") as f:
        f.write(image_bytes)

    print("Image saved!")

asyncio.run(main())