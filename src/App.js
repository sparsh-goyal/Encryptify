import "./App.css";
import axios from "axios";
import Base64 from "base64-js";
import { storage } from "./FirebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";

let encryptedData;
let exportedkey;

function App() {
  const [imageListOrg, setImageListOrg] = useState([]);
  const [imageListEnc, setImageListEnc] = useState([]);
  const [imageListDec, setImageListDec] = useState([]);
  const [iv, setIv] = useState(crypto.getRandomValues(new Uint8Array(16)));

  const uploadToFirebase = (selectedFileName, file, method) => {
    var imageRef;
    if (method === "original") {
      imageRef = ref(storage, `original/${selectedFileName}`);
    } else if (method === "encrypt") {
      imageRef = ref(storage, `encrypted/${selectedFileName}`);
    } else {
      imageRef = ref(storage, `decrypted/${selectedFileName}`);
    }
    uploadBytes(imageRef, file).then((snapshot) => {
      if (method === "encrypt" || method === "decrypt") {
        alert(method + "ed image uploaded to firebase");
      } else {
        alert(method + " image uploaded to firebase");
      }
      getDownloadURL(snapshot.ref).then((url) => {
        if (method === "original") {
          setImageListOrg((prev) => [...prev, url]);
        } else if (method === "encrypt") {
          setImageListEnc((prev) => [...prev, url]);
        } else {
          setImageListDec((prev) => [...prev, url]);
        }
      });
    });
  };

  const encryptFile = async () => {
    var selectedFile = document.querySelector("input").files[0];
    var fileBlob = new Blob([selectedFile]);

    new Response(fileBlob).arrayBuffer().then((orgArrayBuffer) => {
      console.log("original data: ", orgArrayBuffer);
      console.warn(
        "The original file is " + orgArrayBuffer.byteLength + " bytes long"
      ); // represented as ArrayBuffer
    });

    let algorithm = {
      name: "AES-CBC",
      iv: iv,
    };

    let key = await crypto.subtle.generateKey(
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    await crypto.subtle
      .exportKey("jwk", key)
      .then((key) => (exportedkey = key));

    let data = await fileBlob.arrayBuffer();

    encryptedData = await crypto.subtle.encrypt(algorithm, key, data);

    console.log("encrypted data: ", encryptedData);

    console.warn(
      "The encrypted data is " + encryptedData.byteLength + " bytes long"
    ); // encrypted is an ArrayBuffer

    console.log("encrypted exported key: ", exportedkey);
    console.log("encrypted key: ", key); //key is not relevant since we are exporting the key
    console.log("encrypted iv: ", iv);

    console.log("encoded exported key", btoa(JSON.stringify(exportedkey)));
    console.log(
      "encoded encrypted data",
      btoa(String.fromCharCode(...new Uint8Array(encryptedData)))
    ); //key is not relevant since we are exporting the key
    console.log("encoded iv", btoa(String.fromCharCode.apply(null, iv)));

    convertToImg(encryptedData, "encryptedImg");

    uploadToFirebase(selectedFile.name, fileBlob, "original");

    uploadToFirebase(selectedFile.name, encryptedData, "encrypt");

    axios.post("http://localhost:3001/decrypt", {
      data: "hi"
    })
  };

  const decryptFile = async () => {
    let key = await crypto.subtle.importKey(
      "jwk",
      exportedkey,
      { name: "AES-CBC" },
      true,
      ["encrypt", "decrypt"]
    );

    console.warn("here");

    let ivDec = new Uint8Array(iv.toString().split(","));

    let algorithm = {
      name: "AES-CBC",
      iv: ivDec,
    };

    let decryptedData = await crypto.subtle.decrypt(
      algorithm,
      key,
      encryptedData //should be coming from db
    );

    console.log("decrypted data: ", decryptedData);

    uploadToFirebase("decrypted.jpg", decryptedData, "decrypt");

    console.warn(
      "The decrypted data is " + decryptedData.byteLength + " bytes long"
    ); // decrypted is an ArrayBuffer
    console.log("decrypted imported key: ", key);
    console.log("decrypted iv: ", ivDec);

    convertToImg(decryptedData, "decryptedImg");
  };

  const convertToImg = (arrayBufferData, idParam) => {
    var binary = "";
    var bytes = new Uint8Array(arrayBufferData);

    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // document.getElementById(idParam).src =
    //   "data:image/png;base64," + window.btoa(binary);
  };

  return (
    <div className="App">
      <input
        type="file"
        id="file-upload"
        onChange={(evt) => encryptFile(evt)}
      ></input>
      <button onClick={() => decryptFile()}>Decrypt</button>
      {/*   <img src="" id="encryptedImg"></img> */}
      {/* <img src="" id="decryptedImg"></img> */}
      {imageListOrg.map((url, id) => {
        return (
          <>
            <p key={id}>Original Image</p>
            <img src={url} key={id + 1} />
          </>
        );
      })}
      {imageListEnc.map((url, id) => {
        return (
          <>
            <p key={id}>Encrypted Image</p>
            <img src={url} key={id + 1} />
          </>
        );
      })}
      {imageListDec.map((url, id) => {
        return (
          <>
            <p key={id}>Decrypted Image</p>
            <img src={url} key={id + 1} />
          </>
        );
      })}
    </div>
  );
}

export default App;
