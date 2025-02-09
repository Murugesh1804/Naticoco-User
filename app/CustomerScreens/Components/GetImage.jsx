import axios from "axios";
import { Buffer } from "buffer";

async function getImage(imag) {
  const img = imag.split("/ImageStore/")[1];
  // console.log(img);
  try {
    const response = await axios.get(
      `http://147.93.110.87:3500/images/${img}`,
      {
        responseType: "arraybuffer",
      }
    );
    return `data:image/jpeg;base64,${Buffer.from(
      response.data,
      "binary"
    ).toString("base64")}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

export default getImage;
