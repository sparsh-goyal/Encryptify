import "./App.css";
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

    uploadToFirebase(selectedFile.name, fileBlob, "original");

    uploadToFirebase(selectedFile.name, encryptedData, "encrypt");

    // axios.post("http://localhost:3001/decrypt", {
    //   data: "hi",
    // });
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
  };

  return (
    <div className="App">
      <div id="bgDiv">
        <header>
          <h2 className="mb-4 mx-4 pt-5" style={{ color: "white" }}>
            Encryptify
          </h2>
        </header>
        <div>
          <input
            type="file"
            id="fileUploadBtn"
            onChange={(evt) => encryptFile(evt)}
          ></input>
          <button id="decryptBtn" onClick={() => decryptFile()}>
            Decrypt
          </button>
        </div>
        <div className="d-flex justify-content-evenly my-5">
          {imageListOrg.map((url, id) => {
            return (
              <div className="text-center">
                <p key={id}>Original Image</p>
                <img src={url} key={id + 1} />
              </div>
            );
          })}
          {imageListEnc.map((url, id) => {
            return (
              <div className="row text-center">
                <p key={id}>Encrypted Image</p>
                <img src={url} key={id + 1} />
              </div>
            );
          })}
          {imageListDec.map((url, id) => {
            return (
              <div className="text-center">
                <p key={id}>Decrypted Image</p>
                <img src={url} key={id + 1} />
              </div>
            );
          })}
        </div>
        <footer
          style={{
            marginInlineStart: "40%",
          }}
          className="d-flex"
        >
          <h6>Made with ❤ by </h6>
          <a
            href="https://www.linkedin.com/in/sparshgoyal13/"
            style={{ textDecoration: "none", color: "white" }}
          >
            <h6 style={{ whiteSpace: "pre" }}>Sparsh</h6>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
