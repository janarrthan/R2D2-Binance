import path from "path";
import { fileURLToPath } from "url";
import soundPlay from "sound-play";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../alert.mp3");

const playAlert = () => {
  if (process.env.ENVIRONMENT !== "dev") {
    return;
  }

  soundPlay
    .play(filePath)
    .then((res) => {
      playAlert();
    })
    .catch((e) => {
      console.log(e);
    });
};

export default playAlert;
