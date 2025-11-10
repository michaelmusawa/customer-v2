import axios from "axios";

class EmbeddingPipelineSingleton {
  static async embed(text: string) {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_FASTAPI_URL}/embed`,
      {
        text,
      }
    );
    return res.data.embedding as number[];
  }
}

export default EmbeddingPipelineSingleton;
