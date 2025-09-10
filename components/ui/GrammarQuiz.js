// components/ui/GrammarQuiz.js
import { useStore } from '@/hooks/useStore';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

const GrammarQuiz = () => {
  const dailyGrammar = useStore(state => state.dailyGrammar);
  const q = useStore(state => state.q);
  const updateScore = useStore(state => state.updateScore); // changed from addScore
  const increaseQ = useStore(state => state.increaseQ);

  const [question, setQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mcOptions, setMcOptions] = useState([]);
  const [selectedMc, setSelectedMc] = useState(null);

  // escape regex helper
  const escapeRegExp = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // build question & MC options whenever dailyGrammar or q changes
  useEffect(() => {
    if (!dailyGrammar) {
      setQuestion(null);
      setMcOptions([]);
      return;
    }

    // choose a random example from grammar point
    const examples = dailyGrammar.examples || [];
    if (examples.length === 0) {
      // fallback: show structure as 'question'
      setQuestion({
        sentence: dailyGrammar.title || 'Grammar',
        correctAnswer: dailyGrammar.structure || '',
        fullSentence: dailyGrammar.title || '',
        translation: dailyGrammar.explanation || '',
        pinyin: '',
      });
      // MC options: structure + two small distractors
      const d1 = (dailyGrammar.structure || '') + ' (Ví dụ)';
      const d2 = (dailyGrammar.structure || '').replace(/,/g, '') + ' (Không dùng)';
      setMcOptions(shuffle([dailyGrammar.structure || '', d1, d2]));
      return;
    }

    const randomExample = examples[Math.floor(Math.random() * examples.length)];

    // Extract continuous Chinese-character tokens from structure (prefer these as blanks)
    const chineseTokens = (dailyGrammar.structure && typeof dailyGrammar.structure === 'string')
      ? (dailyGrammar.structure.match(/[\u4e00-\u9fff]+/g) || [])
      : [];

    // Prefer a token that appears in the example sentence
    let keyword = chineseTokens.find(tok => randomExample.cn && randomExample.cn.includes(tok));

    // Fallback: try splitting structure into non-space parts and pick first meaningful piece
    if (!keyword) {
      if (chineseTokens.length > 0) {
        keyword = chineseTokens[0];
      } else {
        const parts = (dailyGrammar.structure || '').match(/(\S+)/g) || [];
        keyword = parts.length > 0 ? parts[0].replace(/\+/g, '').trim() : '';
      }
    }

    // Build blanked sentence
    let blankedSentence = randomExample.cn || '';
    if (keyword) {
      const re = new RegExp(escapeRegExp(keyword), 'g');
      blankedSentence = (randomExample.cn || '').replace(re, '___');
    }

    setQuestion({
      sentence: blankedSentence,
      correctAnswer: keyword || '',
      fullSentence: randomExample.cn || '',
      translation: randomExample.vi || '',
      pinyin: randomExample.pinyin || '',
    });

    // Build multiple-choice options for "cách sử dụng / structure"
    const correctStructure = dailyGrammar.structure || '';
    // two simple distractors (heuristic): replace a common connector with a different one
    const distractor1 = correctStructure.replace(/(然后|接着|否则|如果|都|也)/, '如果');
    const distractor2 = correctStructure.replace(/(\+|\band\b|,)/g, ' ').trim() + ' (lệch)';
    setMcOptions(shuffle([correctStructure, distractor1 || correctStructure + ' (1)', distractor2 || correctStructure + ' (2)']));

    // reset UI states
    setAnswerInput('');
    setIsCorrect(null);
    setShowAnswer(false);
    setShowHint(false);
    setSelectedMc(null);
  }, [dailyGrammar, q]);

  const checkAnswer = () => {
    if (!question) return;

    // check text input answer (exact match)
    const textCorrect = answerInput.trim() === question.correctAnswer;
    // check MC answer: if selectedMC equals the structure (we treat MC as separate)
    const mcCorrect = selectedMc === (dailyGrammar?.structure || '');

    const finalCorrect = textCorrect || mcCorrect;
    setIsCorrect(finalCorrect);
    setShowAnswer(true);

    if (finalCorrect) {
      // update score using the store function that exists
      if (typeof updateScore === 'function') updateScore();
    }
  };

  const handleNext = () => {
    setAnswerInput('');
    setIsCorrect(null);
    setShowAnswer(false);
    setShowHint(false);
    setSelectedMc(null);
    increaseQ && increaseQ(); // trigger next question in parent store
  };

  if (!question) {
    return <Text>Loading grammar question...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{dailyGrammar?.title || 'Grammar point'}</Text>
      <Text style={styles.structure}>Cấu trúc: {dailyGrammar?.structure || '—'}</Text>

      <Text style={styles.prompt}>Điền vào chỗ trống:</Text>
      <Text style={styles.sentence}>{question.sentence}</Text>

      {/* show pinyin below (user asked) */}
      {question.pinyin ? <Text style={styles.pinyin}>Pinyin: {question.pinyin}</Text> : null}

      <TextInput
        style={styles.input}
        value={answerInput}
        onChangeText={setAnswerInput}
        placeholder="Nhập đáp án (chữ/cụm bị thiếu)"
        editable={!showAnswer}
      />

      <Text style={styles.mcLabel}>Hoặc chọn cách sử dụng đúng:</Text>
      {mcOptions.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.mcOption,
            selectedMc === opt && styles.mcOptionSelected,
            showAnswer && (opt === dailyGrammar.structure) && styles.mcOptionCorrect
          ]}
          onPress={() => !showAnswer && setSelectedMc(opt)}
        >
          <Text style={styles.mcText}>{String.fromCharCode(65 + idx)}. {opt}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.buttonsRow}>
        {!showAnswer ? (
          <Button title="Kiểm tra" onPress={checkAnswer} />
        ) : (
          <View>
            {isCorrect ? (
              <Text style={styles.correct}>Chính xác! +1 điểm</Text>
            ) : (
              <Text style={styles.incorrect}>Sai rồi. Đáp án: {question.correctAnswer || '(không có)'}</Text>
            )}
            <Text style={styles.fullSentence}>Câu đầy đủ: {question.fullSentence}</Text>
            {question.translation ? <Text style={styles.translation}>Dịch: {question.translation}</Text> : null}
            <Button title="Tiếp theo" onPress={handleNext} />
          </View>
        )}
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title={showHint ? 'Ẩn gợi ý' : 'Gợi ý'} onPress={() => setShowHint(s => !s)} />
        {showHint && (
          <View style={styles.hintBox}>
            <Text>- Pinyin: {question.pinyin || '(không có)'}</Text>
            <Text>- Dịch: {question.translation || '(không có)'}</Text>
            <Text>- Cấu trúc gợi ý: {dailyGrammar?.structure || '—'}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8, margin: 8 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  structure: { fontSize: 14, color: '#2b6cb0', marginBottom: 10 },
  prompt: { fontSize: 14, marginBottom: 6 },
  sentence: { fontSize: 20, marginBottom: 6, lineHeight: 28 },
  pinyin: { fontSize: 14, color: '#555', marginBottom: 8, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, marginBottom: 10 },
  mcLabel: { marginTop: 6, marginBottom: 6, fontWeight: '600' },
  mcOption: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 6,
    backgroundColor: '#fafafa'
  },
  mcOptionSelected: { borderColor: '#2b6cb0' },
  mcOptionCorrect: { borderColor: 'green', backgroundColor: '#e6ffed' },
  mcText: { fontSize: 15 },
  buttonsRow: { marginTop: 8 },
  correct: { color: 'green', fontWeight: '700', marginTop: 8 },
  incorrect: { color: 'red', fontWeight: '700', marginTop: 8 },
  fullSentence: { marginTop: 6, fontStyle: 'italic' },
  translation: { marginTop: 4, color: '#666' },
  hintBox: { marginTop: 8, padding: 8, borderRadius: 6, backgroundColor: '#f7f7f7' }
});

export default GrammarQuiz;
