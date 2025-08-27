import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity, Dimensions } from 'react-native';
import hskData from '@assets/meta/hsk.json';
import { useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useStore } from '@/hooks/useStore';
import { TextInput } from 'react-native-gesture-handler';
const screenDimensions = Dimensions.get('screen');

const TypingQuiz = () => {
    const route = useRoute();
    const increaseN = useStore(state => state.increaseN);
    const increaseQ = useStore(state => state.increaseQ);
    const updateScore = useStore(state => state.updateScore);
    const n = useStore(state => state.n);
    const q = useStore(state => state.q);
    const score = useStore(state => state.score);
    const { randomNumbers } = route.params;
    // const randomNumbers = [2, 1, 3, 6, 9];

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [index, setIndex] = useState(0);
    const [sound, setSound] = useState();
    const [questions, setQuestions] = useState([]);
    const [placeholder, setPlaceholder] = useState('Type your answer')
    const [text, setText] = useState('');

    const fetchData = (indexNumber) => {
        const word = hskData.words[randomNumbers[indexNumber]]['translation-data'];
        setQuestions({
            question: word.simplified,
            pinyin: word.pinyin,
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
        setIndex(Math.floor(q / 2))
    }, [q])

    useEffect(() => {
        setText('')
        increaseN()
    }, []);

    useEffect(() => {
        setTimeout(playPinyinSound(), 300);
        fetchData(index);
    }, [index]);

    useEffect(() => {
        console.log(text);
        if (text == questions.question) {
            setText('')
            setPlaceholder('Type your answer')
            updateScore()
            increaseQ()
            playSound(true).then(() => {
                fetchData(index + 1)
            })
        }
    }, [text]);

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
        if (setSoundUrl(hskData.words[randomNumbers[Math.floor(q / 2)]]['translation-data']['pinyin-numbered'])[1] == '') {
            const { sound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + hskData.words[randomNumbers[Math.floor(q / 2)]]['translation-data']['pinyin-numbered'] + ".mp3"
            });
            // console.log("https://cdn.yoyochinese.com/audio/pychart/"
            // + props.soundUrl + ".mp3");
            setSound(sound);
            //   console.log('Playing Sound');
            await sound.playAsync();
        }
        else {
            const { sound } = await Audio.Sound.createAsync({
                uri: "https://cdn.yoyochinese.com/audio/pychart/"
                    + setSoundUrl(hskData.words[randomNumbers[Math.floor(q / 2)]]['translation-data']['pinyin-numbered'])[0] + ".mp3"
            });

            setSound(sound);

            await sound.playAsync().then(
                setTimeout(async function () {
                    const { sound } = await Audio.Sound.createAsync({
                        uri: "https://cdn.yoyochinese.com/audio/pychart/"
                            + setSoundUrl(hskData.words[randomNumbers[Math.floor(q / 2)]]['translation-data']['pinyin-numbered'])[1] + ".mp3"
                    });

                    setSound(sound);
                    await sound.playAsync()

                }, 600)
            )
        }
    }

    const handleTextChange = (newText) => {
        setText(newText);
    };

    const handleSubmitEditing = () => {
        if (text == questions.question) {
            console.log('Correct')
            setText('')
            setPlaceholder('Type your answer')
            updateScore()
            increaseQ()
            playSound(true).then(() => {
                fetchData(index + 1)
            })
        }
        else {
            console.log('Incorrect')
            playSound(false)
        }
    }

    const handleIconPress = () => {
        setPlaceholder(questions.pinyin)
    };

    return (
        <View>
            <Text style={(screenDimensions.width > 480) ? styles.score : styles.scorePhone}>
                SCORE: {score}</Text>
            {questions ? (
                <View style={(screenDimensions.width > 480) ? styles.questions : styles.questionsPhone}>
                    <Text style={styles.questionsTitle}>
                        <TouchableOpacity
                            onPress={() =>
                                playPinyinSound()}>
                            <Ionicons style={styles.iconicsTitle}
                                name="volume-high" size={48} color="black" />
                        </TouchableOpacity>
                        {questions.correctAnswer}
                    </Text>
                    <View>
                        <View style={styles.inputContainer}>
                            <TextInput autoFocus={true} style={styles.input} placeholder={placeholder}
                                onChangeText={handleTextChange} value={text}
                                onSubmitEditing={() => handleSubmitEditing()}
                            />
                            <TouchableOpacity style={styles.helpContainer} onPress={handleIconPress}>
                                <MaterialIcons name="help-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnContainer}>
                            <Button style={styles.btn} title="Submit" onPress={() => handleSubmitEditing()} />
                        </View>
                    </View>
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
        flexDirection: 'column',
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
    input: {
        flex: 1,
        fontSize: 32,
        padding: 12,
        border: '1.6px solid #000',
        borderRadius: 3
    },
    inputContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnContainer: {
        display: 'flex',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: '30%',
        width: '100%',
    },
});

export default TypingQuiz;