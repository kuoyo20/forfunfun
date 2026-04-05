import { useState, useCallback } from 'react';
import type { Question, FormData, QuestionCategory } from '@/types';
import { INITIAL_FORM_DATA } from '@/types';
import { questionDatabase } from '@/constants';
import { supabase } from '@/integrations/supabase/client';

interface UseQuestionGeneratorReturn {
  formData: FormData;
  questions: Question[];
  generated: boolean;
  aiLoading: boolean;
  useAI: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setUseAI: (val: boolean) => void;
  generate: (researchContext?: string | null) => Promise<void>;
  reset: () => void;
}

function buildLocalQuestions(formData: FormData): Question[] {
  let resultList: Question[] = [...questionDatabase.general];

  const historyCategory: QuestionCategory = formData.history === 'new' ? 'newClient' : 'existingClient';
  resultList = [...resultList, ...questionDatabase[historyCategory]];

  const roleCategory = formData.targetRole as QuestionCategory;
  if (questionDatabase[roleCategory]) {
    resultList = [...resultList, ...questionDatabase[roleCategory]];
  }

  resultList = [...resultList, ...questionDatabase.closing];

  const finalQuestions = resultList.map(q => ({
    ...q,
    ask: q.ask.replace(/{product}/g, formData.product).replace(/{client}/g, formData.clientName),
  }));

  if (formData.clientFocus) {
    finalQuestions.splice(3, 0, {
      id: 'focus1',
      ask: `您剛才有提到目前最在意「${formData.clientFocus}」，請問在這方面，您希望供應商能怎麼配合最理想？`,
      listen: `針對${formData.clientFocus}的具體解決方案需求。`,
      praise: "這個要求很合理，我們完全可以依照您的重點來調整服務內容。",
      type: 'custom',
    });
  }

  return finalQuestions;
}

export function useQuestionGenerator(): UseQuestionGeneratorReturn {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [generated, setGenerated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const generate = useCallback(async (researchContext?: string | null) => {
    if (!formData.product || !formData.clientName) {
      alert("請至少輸入「推廣產品」與「客戶品牌名」");
      return;
    }

    if (useAI) {
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-questions', {
          body: {
            ...formData,
            researchContext: researchContext || undefined,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setQuestions(data.questions || data);
        setGenerated(true);
      } catch (e) {
        console.error('AI generation failed, falling back to local:', e);
        setQuestions(buildLocalQuestions(formData));
        setGenerated(true);
      } finally {
        setAiLoading(false);
      }
    } else {
      setQuestions(buildLocalQuestions(formData));
      setGenerated(true);
    }
  }, [formData, useAI]);

  const reset = useCallback(() => {
    setGenerated(false);
    setQuestions([]);
    setFormData(INITIAL_FORM_DATA);
  }, []);

  return {
    formData, questions, generated, aiLoading, useAI,
    setFormData, setUseAI, generate, reset,
  };
}
