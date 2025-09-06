import grammarData from '@assets/meta/hsk4_grammar.json';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DailyGrammarSectionProps {
  lessonId: number;
}

export const DailyGrammarSection: React.FC<DailyGrammarSectionProps> = ({ lessonId }) => {
  const lesson = grammarData.lessons.find(l => l.lessonId === lessonId);

  if (!lesson || lesson.grammarPoints.length === 0) {
    return (
      <View style={styles.grammarSection}>
        <Text style={styles.grammarTitle}>Daily Grammar</Text>
        <Text style={styles.grammarContent}>No grammar points available for today.</Text>
      </View>
    );
  }

  const randomIndex = Math.floor(Math.random() * lesson.grammarPoints.length);
  const grammarPoint = lesson.grammarPoints[randomIndex];

  return (
    <View style={styles.grammarSection}>
      <Text style={styles.grammarTitle}>{grammarPoint.title}</Text>
      <Text style={styles.grammarStructure}>{grammarPoint.structure}</Text>
      <Text style={styles.grammarMeaning}>Ý nghĩa: {grammarPoint.meaning}</Text>
      <Text style={styles.grammarContent}>
        {grammarPoint.explanation}
      </Text>
      <Text style={styles.exampleTitle}>Ví dụ:</Text>
      {grammarPoint.examples.map((example, index) => (
        <Text key={index} style={styles.exampleText}>
          - {example.cn} ({example.pinyin})
          {'\n'}
          <Text style={styles.translationText}>{example.vi}</Text>
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grammarSection: {
    backgroundColor: '#e3e3e3',
    borderRadius: 10,
    padding: 16,
    margin: 16,
  },
  grammarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  grammarStructure: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005A9C',
    marginBottom: 8,
  },
  grammarMeaning: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#444',
    marginBottom: 12,
  },
  grammarContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 8,
  },
  translationText: {
    fontStyle: 'italic',
    color: '#666',
  },
});
