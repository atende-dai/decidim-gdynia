/* eslint-disable no-plusplus, require-jsdoc */

/**
 * Nadpisany plik z decidim-forms 0.30.5 (src/decidim/forms/display_conditions.component.js).
 * Zmiany oznaczono komentarzem "gdynia". Przy aktualizacji Decidim porownac z oryginalem.
 */

class DisplayCondition {
  constructor(options = {}) {
    this.wrapperField = options.wrapperField;
    this.type = options.type;
    this.conditionQuestion = options.conditionQuestion;
    this.answerOption = options.answerOption;
    this.mandatory = options.mandatory;
    this.value = options.value;
    this.onFulfilled = options.onFulfilled;
    this.fulfilled = false;
    this.bindEvent();
  }

  // gdynia: warunek nie jest sprawdzany tutaj, robi to DisplayConditionsComponent
  // po utworzeniu wszystkich warunkow pytania
  bindEvent() {
    this.getInputsToListen().on("change", this.checkCondition.bind(this));
  }

  getInputValue() {
    const $conditionWrapperField = $(`.question[data-question-id='${this.conditionQuestion}']`);
    const $textInput = $conditionWrapperField.find("textarea, input[type='text']:not([name$=\\[custom_body\\]])");

    if ($textInput.length) {
      return $textInput.val();
    }

    let multipleInput = [];

    $conditionWrapperField.find(".js-radio-button-collection, .js-check-box-collection").find(".js-collection-input").each((idx, el) => {
      const $input = $(el).find("input[name$=\\[body\\]]");
      const checked = $input.is(":checked");

      if (checked) {
        const text = $(el).find("input[name$=\\[custom_body\\]]").val();
        const value = $input.val();
        const id = $(el).find("input[name$=\\[answer_option_id\\]]").val();

        multipleInput.push({ id, value, text });
      }
    });

    return multipleInput;
  }

  getInputsToListen() {
    const $conditionWrapperField = $(`.question[data-question-id='${this.conditionQuestion}']`);
    const $textInput = $conditionWrapperField.find("textarea, input[type='text']:not([name$=\\[custom_body\\]])");

    if ($textInput.length) {
      return $textInput;
    }

    return $conditionWrapperField.find(".js-collection-input").find("input:not([type='hidden'])");
  }

  checkAnsweredCondition(value) {
    if (typeof (value) !== "object") {
      return Boolean(value);
    }

    return Boolean(value.some((it) => it.value));
  }

  checkNotAnsweredCondition(value) {
    return !this.checkAnsweredCondition(value);
  }

  checkEqualCondition(value) {
    if (value.length) {
      return value.some((it) => it.id === this.answerOption.toString());
    }
    return false;
  }

  checkNotEqualCondition(value) {
    if (value.length) {
      return value.every((it) => it.id !== this.answerOption.toString());
    }
    return false;
  }

  checkMatchCondition(value) {
    let regexp = new RegExp(this.value, "i");

    if (typeof (value) !== "object") {
      return Boolean(value.match(regexp));
    }

    return value.some(function (it) {
      return it.text
        ? it.text.match(regexp)
        : it.value.match(regexp)
    });
  }

  checkCondition() {
    const value = this.getInputValue();
    let fulfilled = false;

    switch (this.type) {
    case "answered":
      fulfilled = this.checkAnsweredCondition(value);
      break;
    case "not_answered":
      fulfilled = this.checkNotAnsweredCondition(value);
      break;
    case "equal":
      fulfilled = this.checkEqualCondition(value);
      break;
    case "not_equal":
      fulfilled = this.checkNotEqualCondition(value);
      break;
    case "match":
      fulfilled = this.checkMatchCondition(value);
      break;
    default:
      fulfilled = false;
      break;
    }

    this.onFulfilled(fulfilled);
  }
}

class DisplayConditionsComponent {
  constructor(options = {}) {
    this.wrapperField = options.wrapperField;
    this.conditions = {};
    this.showCount = 0;
    this.initializeConditions();
  }

  initializeConditions() {
    const $conditionElements = this.wrapperField.find(".display-condition");

    $conditionElements.each((idx, el) => {
      const $condition = $(el);
      const id = $condition.data("id");
      this.conditions[id] = new DisplayCondition({
        wrapperField: this.wrapperField,
        type: $condition.data("type"),
        conditionQuestion: $condition.data("condition"),
        answerOption: $condition.data("option"),
        mandatory: $condition.data("mandatory"),
        value: $condition.data("value"),
        onFulfilled: (fulfilled) => {
          this.onFulfilled(id, fulfilled);
        }
      });
    });

    // gdynia: w oryginale warunki byly sprawdzane w trakcie tworzenia i wynik wszystkich
    // poza ostatnim przepadal, przez co pytanie bylo ukrywane po ponownym
    // wyswietleniu formularza z zaznaczonymi odpowiedziami (np. po bledzie walidacji)
    Object.values(this.conditions).forEach((condition) => condition.checkCondition());
  }

  mustShow() {
    const conditions = Object.values(this.conditions);
    const mandatoryConditions = conditions.filter((condition) => condition.mandatory);
    const nonMandatoryConditions = conditions.filter((condition) => !condition.mandatory);

    if (mandatoryConditions.length) {
      return mandatoryConditions.every((condition) => condition.fulfilled);
    }

    return nonMandatoryConditions.some((condition) => condition.fulfilled);

  }

  onFulfilled(id, fulfilled) {
    this.conditions[id].fulfilled = fulfilled;

    if (this.mustShow()) {
      this.showQuestion();
    }
    else {
      this.hideQuestion();
    }
  }

  showQuestion() {
    this.wrapperField.fadeIn();
    this.wrapperField.find("input, textarea").prop("disabled", null);
    this.disableUncheckedOptionInputs();
    this.showCount++;
  }

  // gdynia: pola zalezne (answer_option_id, custom_body) niezaznaczonych opcji musza pozostac
  // wylaczone, inaczej przy pytaniach jednokrotnego wyboru wysylane jest id zlej opcji
  // (ta sama regula co w option_attached_inputs.component)
  disableUncheckedOptionInputs() {
    this.wrapperField.
      find(".js-radio-button-collection, .js-check-box-collection").
      find("input[type=radio], input[type=checkbox]").
      each((idx, el) => {
        $(el).
          parents("div.js-collection-input").
          find("input[type=text], input[type=hidden]").
          prop("disabled", !el.checked);
      });
  }

  hideQuestion() {
    if (this.showCount) {
      this.wrapperField.fadeOut();
    }
    else {
      this.wrapperField.hide();
    }

    this.wrapperField.find("input, textarea").prop("disabled", "disabled");
  }
}

export default function createDisplayConditions(options) {
  return new DisplayConditionsComponent(options);
}
