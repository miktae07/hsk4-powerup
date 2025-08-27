import { useStore } from '@/hooks/useStore';
import hskData from '@assets/meta/hsk.json';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight, TouchableOpacity,
  View
} from 'react-native';
const screenDimensions = Dimensions.get('screen');

const MultipleChoiceQuiz = () => {
  const [stateKey, setStateKey] = useState(0);
  const score = useStore(state => state.score);
  const q = useStore(state => state.q);
  const route = useRoute();
  const increaseN = useStore(state => state.increaseN);
  const increaseQ = useStore(state => state.increaseQ);
  const updateScore = useStore(state => state.updateScore);

  // Fallback for randomNumbers if route.params is undefined
  const randomNumbers = route.params && route.params.randomNumbers ? route.params.randomNumbers : [];
  console.log(randomNumbers);
  // const randomNumbers = [2, 1, 3, 6, 9];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [index, setIndex] = useState(0);
  const [sound, setSound] = useState();
  const [questions, setQuestions] = useState([]);
  const query = ["A", "B", "C", "D", "E"];

  document.addEventListener("keydown", (event) => {
/*     console.log(0, event.key); */
    setStateKey(event.key.toUpperCase())
  });

  useEffect(() => {
   /*  console.log(stateKey); */
    if (stateKey) {
/*       console.log(questions.answers[query.indexOf(stateKey)]);
 */      onAnswer(questions.answers[query.indexOf(stateKey)]);
    }
  }, [stateKey])

  const fetchData = (indexNumber) => {
    if (!randomNumbers || !Array.isArray(randomNumbers) || randomNumbers[indexNumber] === undefined) {
      setQuestions(null);
      return;
    }
    const word = hskData.words[randomNumbers[indexNumber]]['translation-data'];
    const answers = Array.from({ length: 5 }, () => {
      const randomNumber = generateUniqueNumber();
      return hskData.words[randomNumbers[randomNumber]]['translation-data'].english;
    });
    setQuestions({
      question: word.simplified,
      pinyin: word.pinyin,
      answers,
      correctAnswer: word.english,
    });
  };

  let previousNumbers = [];

  const generateUniqueNumber = () => {
    let randomNumber = Math.floor(Math.random() * 5);
    while (previousNumbers.includes(randomNumber)) {
      randomNumber = Math.floor(Math.random() * 5);
    }
    previousNumbers.push(randomNumber);
    return randomNumber;
  };

  async function playSound(m_type) {
    // console.log('Loading Sound');

    if (m_type === true) {
      const { sound } = await Audio.Sound.createAsync(
        require('@assets/audio/correct.mp3')
      );
      setSound(sound);
      await sound.playAsync()
    }
    else if (m_type === false) {
      const { sound } = await Audio.Sound.createAsync(
        require('@assets/audio/incorrect.wav')
      );
      setSound(sound);
      await sound.playAsync()
    }
  }

  useEffect(() => {
    setIndex(Math.floor(q / 2))
  }, [q])

  useEffect(() => {
    // console.log(screenDimensions);
    increaseN()
  }, []);

  useEffect(() => {
   /*  console.log('index = ', index); */
    fetchData(index);
    playPinyinSound()
  }, [index]);


  function setSoundUrl(url) {
    const soundUrlArr = [];
    const match = url.match(/^([a-zA-Z]+)(\d.*)/);

    if (match) {
      const firstPart = match[1] + match[2].match(/^\d+/)[0];
      const secondPart = match[2].replace(/^\d+/, '');
      soundUrlArr.push(firstPart);
      soundUrlArr.push(secondPart);

      //   console.log(firstPart, secondPart);
    } else {
      console.log('Invalid string');
    }
    return soundUrlArr;
  }

  const playPinyinSound = async () => {
    // Safety checks for randomNumbers and hskData
    if (!randomNumbers || !Array.isArray(randomNumbers)) return;
    const idx = randomNumbers[Math.floor(q / 2)];
    if (idx === undefined) return;
    const wordData = hskData.words && hskData.words[idx] && hskData.words[idx]['translation-data'];
    if (!wordData || !wordData['pinyin-numbered']) return;
    const pinyinNumbered = wordData['pinyin-numbered'];
    const soundUrlArr = setSoundUrl(pinyinNumbered);
    if (soundUrlArr[1] === '') {
      const { sound } = await Audio.Sound.createAsync({
        uri: "https://cdn.yoyochinese.com/audio/pychart/" + pinyinNumbered + ".mp3"
      });
      setSound(sound);
      await sound.playAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync({
        uri: "https://cdn.yoyochinese.com/audio/pychart/" + soundUrlArr[0] + ".mp3"
      });
      setSound(sound);
      await sound.playAsync();
      setTimeout(async function () {
        const { sound: sound2 } = await Audio.Sound.createAsync({
          uri: "https://cdn.yoyochinese.com/audio/pychart/" + soundUrlArr[1] + ".mp3"
        });
        setSound(sound2);
        await sound2.playAsync();
      }, 600);
    }
  }

  const onAnswer = (answer) => {
/*     console.log(answer); */
    const isCorrect = questions.correctAnswer === answer;
    if (isCorrect) {
      playSound(true);
      updateScore();
      setCurrentQuestion(currentQuestion + 1);
      increaseQ()
    } else {
      playSound(false);
    }
    // console.log(index);
  };

  return (
    <View>
      <Text style={(screenDimensions.width > 480) ? styles.score : styles.scorePhone}>
        SCORE: {score}</Text>
      {questions ? (
        <View style={(screenDimensions.width > 480) ? styles.questions : styles.questionsPhone}>
          <Text style={styles.questionsTitle}>
            {questions.question} /{questions.pinyin}/
            <TouchableOpacity
              onPress={() =>
                playPinyinSound()}>
              <Ionicons style={styles.iconicsTitle}
                name="volume-high" size={24} color="black" />
            </TouchableOpacity>
            meaning:
          </Text>

          {questions.answers && questions.answers.map((answer, index) => (
            <TouchableHighlight style={(screenDimensions.width > 480) ? styles.touchableHighlight
              : styles.touchableHighlightPhone} key={index} onPress={() => onAnswer(answer)}>
              <Text style={(screenDimensions.width > 480) ? styles.answers
                : styles.answersPhone}>{query[index]}, {answer}</Text>
            </TouchableHighlight>
          ))}
        </View>
      ) : (
        <Text>Data failed to set</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  questions: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    paddingHorizontal: 180,
  },
  questionsPhone: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    width: screenDimensions.width,
    height: screenDimensions.height
  },
  questionsTitle: {
    display: 'flex',
    fontSize: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25
  },
  iconicsTitle: {
    marginTop: 8,
  },
  touchableHighlight: {
    backgroundColor: '#fff',
    borderWidth: 0.001,
    borderRadius: 3,
    margin: 5,
    padding: 3,
  },
  touchableHighlightPhone: {
    backgroundColor: '#fff',
    borderWidth: 0.001,
    justifyContent: 'center',
    borderRadius: 3,
    marginVertical: 5,
    marginHorizontal: 3,
    width: screenDimensions.width - 10,
  },
  answers: {
    fontSize: 25,
    alignItems: 'center',
    backgroundColor: '#ececec',
    padding: 9,
    overflow: 'hidden',
  },
  answersPhone: {
    fontSize: 25,
    alignItems: 'center',
    backgroundColor: '#ececec',
    paddingVertical: 9,
    paddingLeft: 10,
    overflow: 'hidden',
  },
  score: {
    fontSize: 25,
    margin: 5,
  },
  scorePhone: {
    fontSize: 18,
    textAlign: 'right',
    marginRight: 10,
  },
  congratText: {
    fontSize: 20,
  }
});

export default MultipleChoiceQuiz;