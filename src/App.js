import { useState } from "react";

import {
  TextAnalysisClient,
  AzureKeyCredential,
} from "@azure/ai-language-text";

const client1 = new TextAnalysisClient(
  /*"https://phhr.cognitiveservices.azure.com/",
  new AzureKeyCredential("3cdb86c4eb954bfcab06144975bbbbd9")*/
  "https://languagemulti.cognitiveservices.azure.com/",
  new AzureKeyCredential("3d1d0e2dc5ee4ccabf4e8ac856af45b2")
);

const { DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

const client2 = new DocumentAnalysisClient(
  "https://languagemulti.cognitiveservices.azure.com/",
  new AzureKeyCredential("3d1d0e2dc5ee4ccabf4e8ac856af45b2")
);

function App() {
  const [msg, setMsg] = useState("");
  const [ans, setAns] = useState("");
  const [model, setModel] = useState("");
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [question, setQuestion] = useState("");

  const changeMsg = (event) => {
    setMsg(event.target.value);
  };

  const changeModel = (event) => {
    setModel(event.target.value);
  };

  const changeText = (event) => {
    setText(event.target.value);
  };

  const changeSource = (event) => {
    setSource(event.target.value);
  };

  const changeQuestion = (event) => {
    setQuestion(event.target.value);
  };

  const analyzeSentiment = async () => {
    const results = await client1.analyze("SentimentAnalysis", [msg], {
      includeOpinionMining: true,
    });

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(`- Document ${result.id}`);
      if (!result.error) {
        console.log(`\tDocument text: ${msg.text}`);
        console.log(`\tOverall Sentiment: ${result.sentiment}`);
        console.log("\tSentiment confidence scores:", result.confidenceScores);
        console.log("\tSentences");
        for (const {
          sentiment,
          confidenceScores,
          opinions,
        } of result.sentences) {
          console.log(`\t- Sentence sentiment: ${sentiment}`);
          console.log("\t  Confidence scores:", confidenceScores);
          console.log("\t  Mined opinions");
          setAns(sentiment);
          for (const { target, assessments } of opinions) {
            console.log(`\t\t- Target text: ${target.text}`);
            console.log(`\t\t  Target sentiment: ${target.sentiment}`);
            console.log(
              "\t\t  Target confidence scores:",
              target.confidenceScores
            );
            console.log("\t\t  Target assessments");
            for (const { text, sentiment } of assessments) {
              console.log(`\t\t\t- Text: ${text}`);
              console.log(`\t\t\t  Sentiment: ${sentiment}`);
            }
          }
        }
      } else {
        console.error(`\tError: ${result.error}`);
      }
    }
  };

  const formAnalyzer = async () => {
    const poller = await client2.beginAnalyzeDocumentFromUrl(model, source);

    // There are more fields than just these three
    const { documents, pages, tables, ...rest } = await poller.pollUntilDone();
    console.log("rest", rest);

    console.log("Documents:");
    for (const document of documents || []) {
      console.log(`Type: ${document.docType}`);
      console.log("Fields:");
      for (const [name, field] of Object.entries(document.fields)) {
        console.log(
          `Field ${name} has value '${field.value}' with a confidence score of ${field.confidence}`
        );
      }
    }
    console.log("Pages:");
    for (const page of pages || []) {
      console.log(
        `Page number: ${page.pageNumber} (${page.width}x${page.height} ${page.unit})`
      );
    }

    console.log("Tables:");
    for (const table of tables || []) {
      console.log(`- Table (${table.columnCount}x${table.rowCount})`);
      for (const cell of table.cells) {
        console.log(
          `  - cell (${cell.rowIndex},${cell.columnIndex}) "${cell.content}"`
        );
      }
    }
  };

  const QnA = () => {
    const LANGUAGE_KEY = "3cdb86c4eb954bfcab06144975bbbbd9";
    const LANGUAGE_ENDPOINT = "https://phhr.cognitiveservices.azure.com";

    const url = `${LANGUAGE_ENDPOINT}/language/:query-text?api-version=2021-10-01`;

    const data = {
      question: `${question}`,
      records: [
        {
          id: "doc1",
          text: `${text}`,
        },
      ],
      language: "en",
      stringIndexType: "Utf16CodeUnit",
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": LANGUAGE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  };

  return (
    <div>
      <p>sentiment analysis</p>
      <input type="text" value={msg} onChange={changeMsg} />
      <button type="button" onClick={analyzeSentiment}>
        Submit
      </button>
      <p>{ans === "" ? null : ans}</p>
      <p>form analyzer</p>
      <input type="text" value={model} onChange={changeModel} />
      <input type="text" value={source} onChange={changeSource} />
      <button type="button" onClick={formAnalyzer}>
        Submit
      </button>
      <p>QnA from text</p>
      <input type="text" value={text} onChange={changeText} />
      <input type="text" value={question} onChange={changeQuestion} />
      <button type="button" onClick={QnA}>
        Submit
      </button>
    </div>
  );
}

export default App;
