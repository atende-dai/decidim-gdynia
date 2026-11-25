Decidim::Surveys::SurveysController.class_eval do

  def show
    if questionnaire_for.current_user_can_visit_survey?(current_user)
      @form = form(Decidim::Forms::QuestionnaireForm).from_model(questionnaire)
      render template: "decidim/forms/questionnaires/show"
    else
      flash[:alert] = I18n.t("survey.not_allowed", scope: "decidim.surveys")
      redirect_to(participatory_space_link)
    end
  end

  # nadpisane z Decidim::Forms::Concerns::HasQuestionnaire (0.30.5), dodane add_missing_responses!
  def answer
    enforce_permission_to_answer_questionnaire

    @form = form(Decidim::Forms::QuestionnaireForm).from_params(params, session_token:, ip_hash:)

    Decidim::Forms::AnswerQuestionnaire.call(@form, questionnaire, allow_editing_answers: allow_editing_answers?) do
      on(:ok) do
        flash[:notice] = I18n.t("answer.success", scope: i18n_flashes_scope)
        redirect_to after_answer_path
      end

      on(:invalid) do
        @form.add_missing_responses!(questionnaire)
        flash.now[:alert] = I18n.t("answer.invalid", scope: i18n_flashes_scope)
        render template: "decidim/forms/questionnaires/show"
      end
    end
  end

  def participatory_space_link
    current_component.participatory_space.class.name == 'Decidim::ParticipatoryProcess' ?
                  decidim_participatory_processes.participatory_process_path(current_component.participatory_space)
                  : decidim_assemblies.assembly_path(current_component.participatory_space)

  end

  private

  # nadpisane z Decidim::Forms::Concerns::HasQuestionnaire (0.30.5), dodane add_missing_responses!
  def spam_detected
    enforce_permission_to_answer_questionnaire

    @form = form(Decidim::Forms::QuestionnaireForm).from_params(params)
    @form.add_missing_responses!(questionnaire)

    flash.now[:alert] = I18n.t("answer.spam_detected", scope: i18n_flashes_scope)
    render template: "decidim/forms/questionnaires/show"
  end
end
