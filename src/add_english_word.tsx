import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import axios from 'axios';
import * as cheerio from 'cheerio';

type Values = {
  word: string;
  sentence: string;
  meaning: string;
  deck: string;
  translate_to: string;
};

export default function Command() {
  function handleSubmit(values: Values) {
    addAnkiCard(values.word, values.sentence, values.meaning, values.deck);
    console.log(values);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="word" title="Word" placeholder="Enter a word" />
      <Form.TextArea id="sentence" title="Sentence" placeholder="Enter a sentence including the word." />
      <Form.TextArea id="meaning" title="Meaning" placeholder="Enter the meaning of the word." />
      <Form.Separator />
      <Form.TextField id="deck" title="Deck" placeholder="Enter deck" defaultValue="English" />

    </Form>
  );
}


function addAnkiCard(word: string, sentence: string, meaning: string, deck: string) {
    const front = getFront(word, sentence)
    const back = getBack(word, meaning)

    const request = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": deck,
                "modelName": "Basic",
                "fields": {"Front": front, "Back": back},
                "tags": [],
            }
        },
    }

    axios.post("http://127.0.0.1:8765", request)
        .then(showResponse)
        .catch(catchError);
}

const getFront = (word: string, sentence: string) => {
    sentence = sentence.replace(word, `<u>${word}</u>`)
    return `<h1>${word}</h1><p>${sentence}</p>`
}

export const getBack = async (word: string, meaning: string) => {
    return `<h1>${word}</h1><p>${meaning}</p>`;
}

const showResponse = (response:any) => {
    const result = response.data;
    if (result.error) {
        showToast({ style: Toast.Style.Failure, title: "Error", message: result.error });
        console.log("Error:", result.error);
    } else {
      showToast({ style: Toast.Style.Success, title: "Success", message: "Note added successfully" });
    }
}

const catchError = (error: any) => {
    showToast({ style: Toast.Style.Failure, title: "Error", message: "Error adding note to deck" });
    console.error("Error:", error);
}
