# frozen_string_literal: true

Decidim::Forms::QuestionnaireForm.class_eval do
  # Pytania warunkowe ukryte w chwili wysylania maja wylaczone wszystkie pola (takze question_id),
  # wiec nie ma ich w formularzu zbudowanym z params. Bez ich uzupelnienia formularz wyswietlony
  # ponownie po bledzie nie zawiera tych pytan i nie mozna ich juz pokazac.
  #
  # Wywolywac dopiero po walidacji, przed ponownym wyswietleniem formularza - dodane pytania nie sa
  # walidowane. Separatory nigdy nie sa przesylane i celowo nie sa przywracane: po bledzie formularz
  # jest jednostronicowy, dzieki czemu widac wszystkie bledy.
  def add_missing_responses!(questionnaire)
    submitted = responses.index_by { |response| response.question_id.to_i }

    self.responses = questionnaire.questions.reject(&:separator?).map do |question|
      submitted[question.id] ||
        Decidim::Forms::AnswerForm.from_model(Decidim::Forms::Answer.new(question:)).with_context(context)
    end

    @responses_by_step = nil
  end
end
