import { useStore } from '@/hooks/useStore';
import hskData from '@assets/meta/hsk4.json';
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

  // Parse randomNumbers from URL parameters
  const randomNumbers = route.params?.randomNumbers 
    ? route.params.randomNumbers.split(',').map(num => parseInt(num.trim()))
    : [];
  console.log('Parsed randomNumbers:', randomNumbers);

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
    console.log('fetchData called with indexNumber:', indexNumber);
    
    // Validate input parameters
    if (!Array.isArray(randomNumbers) || randomNumbers.length < 4 || indexNumber >= randomNumbers.length) {
      // Handle error: not enough data
      setQuestions(null);
      return;
    }
    for (let i = 0; i < 4; i++) {
      if (typeof randomNumbers[i] !== 'number' || isNaN(randomNumbers[i])) {
        // Handle error: invalid index
        setQuestions(null);
        return;
      }
      // Now it's safe to use randomNumbers[i]
    }

    const correctIdx = randomNumbers[indexNumber];
    
    // Validate the word exists in hskData
    if (!hskData[correctIdx] || !hskData[correctIdx]['translation-data']) {
      console.log('Word data not found for index:', correctIdx);
      setQuestions(null);
      return;
    }

    const word = hskData[correctIdx]['translation-data'];
    console.log('Selected word:', word);

    // Pick 4 unique random indices from hskData, not including the correct answer
    const usedIndices = new Set([correctIdx]);
    const validIndices = [];
    
    // Pre-filter valid indices
    for (let i = 0; i < hskData.length; i++) {
      if (i !== correctIdx && 
          hskData[i] && 
          hskData[i]['translation-data'] && 
          hskData[i]['translation-data'].english) {
        validIndices.push(i);
      }
    }

    // Randomly select 4 indices
    const answerIndices = [];
    while (answerIndices.length < 4 && validIndices.length > 0) {
      const randIndex = Math.floor(Math.random() * validIndices.length);
      const selectedIndex = validIndices[randIndex];
      validIndices.splice(randIndex, 1);
      answerIndices.push(selectedIndex);
    }

    // Collect the 4 random answers + the correct answer, then shuffle
    const answers = [
      word.english,
      ...answerIndices.map(idx => hskData[idx]['translation-data'].english)
    ].sort(() => Math.random() - 0.5);

    setQuestions({
      question: word.simplified,
      pinyin: word.pinyin,
      answers,
      correctAnswer: word.english,
    });

    console.log('Questions state set:', {
      question: word.simplified,
      pinyin: word.pinyin,
      answers,
      correctAnswer: word.english,
    });
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
    const newIndex = Math.floor(q / 2);
    if (newIndex < randomNumbers.length) {
      setIndex(newIndex);
    }
  }, [q, randomNumbers]);

  useEffect(() => {
    // console.log(screenDimensions);
    increaseN();
  }, []);

  useEffect(() => {
    console.log('index = ', index);
    fetchData(index);
  }, [index]);

  // Separate effect for sound to handle user interaction requirement
  useEffect(() => {
    const playSound = async () => {
      try {
        if (questions && questions.pinyin) {
          await playPinyinSound();
        }
      } catch (error) {
        console.log('Sound playback error:', error);
        // Don't throw the error - just log it
      }
    };
    
    playSound();
  }, [questions]);


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
    try {
      // Use current questions state instead of recalculating from randomNumbers
      if (!questions || !questions.pinyin) return;
      
      const currentWord = hskData[randomNumbers[index]];
      // if (!currentWord || !currentWord['translation-data'] || !currentWord['translation-data']['pinyin-numbered']) {
      //   console.log('No pinyin data available for current word');
      //   return;
      // }

      const pinyinNumbered = currentWord['translation-data']['pinyin-numbered'];
      const soundUrlArr = setSoundUrl(pinyinNumbered);

      // Clean up previous sound if it exists
      if (sound) {
        await sound.unloadAsync();
      }

      if (soundUrlArr[1] === '') {
        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: "https://cdn.yoyochinese.com/audio/pychart/" + pinyinNumbered + ".mp3"
        }, { shouldPlay: false }); // Don't auto-play
        setSound(newSound);
        await newSound.playAsync();
      } else {
        const { sound: firstSound } = await Audio.Sound.createAsync({
          uri: "https://cdn.yoyochinese.com/audio/pychart/" + soundUrlArr[0] + ".mp3"
        }, { shouldPlay: false }); // Don't auto-play
        setSound(firstSound);
        
        try {
          await firstSound.playAsync();
          await new Promise(resolve => setTimeout(resolve, 600));
          
          const { sound: secondSound } = await Audio.Sound.createAsync({
            uri: "https://cdn.yoyochinese.com/audio/pychart/" + soundUrlArr[1] + ".mp3"
          }, { shouldPlay: false }); // Don't auto-play
          
          await firstSound.unloadAsync(); // Clean up first sound
          setSound(secondSound);
          await secondSound.playAsync();
        } catch (error) {
          console.log('Error playing sound sequence:', error);
        }
      }
    } catch (error) {
      console.log('Error in playPinyinSound:', error);
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