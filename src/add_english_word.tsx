import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { useDebouncedValue, useSelectedLanguagesSet, useTextState } from "./translate_src/hooks";
import { AUTO_DETECT, simpleTranslate } from "./translate_src/simple-translate";
import { LanguageCode, supportedLanguagesByCode, languages, getLanguageFlag } from "./translate_src/languages";

type Values = {
  word: string;
  sentence: string;
  translation: string;
  deck: string;
  translate_to: string;
};

export default function Command() {
  const [selectedLanguageSet, setSelectedLanguageSet] = useSelectedLanguagesSet();
  const langFrom = selectedLanguageSet.langFrom;
  const langTo = selectedLanguageSet.langTo;
  const fromLangObj = supportedLanguagesByCode[langFrom];
  const toLangObj = supportedLanguagesByCode[langTo];

  const [selected_text, setText] = useTextState();
  const debouncedValue = useDebouncedValue(selected_text, 500);
  const { data: translated, isLoading } = usePromise(
    simpleTranslate,
    [debouncedValue, { langFrom: fromLangObj.code, langTo: toLangObj.code }],
    {
      onError(error) {
        showToast({
          style: Toast.Style.Failure,
          title: error.name,
          message: error.message,
        });
      },
    },
  );

  function handleSubmit(values: Values) {
    console.log(values);
    const front = getFront(values.word, values.sentence);
    const back = getBack(values.word, values.translation);
    addAnkiCard(front, back, values.deck);
  }

  const handleSentenceChange = (value: string) => {
    if (value.length > 5000) {
      setText(value.slice(0, 5000));
      showToast({
        style: Toast.Style.Failure,
        title: "Limit",
        message: "Max length (5000 chars) for a single translation exceeded",
      });
    } else {
      setText(value);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="word" title="Word" placeholder="Enter a word" />
      <Form.TextArea id="sentence" title="Sentence" placeholder="Enter a sentence including the word."
        value={selected_text}
        onChange={handleSentenceChange}
      />
      <Form.Separator />
      <Form.TextField id="deck" title="Deck" placeholder="Enter deck" storeValue />
      <Form.TextArea
        id="translation"
        title="Translation"
        value={translated?.translatedText ?? ""}
        placeholder="Translation"
      />

    </Form>
  );
}


function addAnkiCard(front: string, back: string, deck: string) {
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
        "options": {"allowDuplicate": true,
                    "duplicateScope": "deck"}
    }

    console.log(request);
    console.log({"Front": front, "Back": back})
    axios.post("http://127.0.0.1:8765", request)
        .then(showResponse)
        .catch(catchError);
}

const getFront = (word: string, sentence: string) => {
    sentence = sentence.replace(word, `<u>${word}</u>`)
    return `<h1>${word}</h1><p>${sentence}</p>`
}

export const getBack = (word: string, translation: string) => {
    return `<p>${translation}</p>`;
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
