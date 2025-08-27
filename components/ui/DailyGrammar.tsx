import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const DailyGrammarSection: React.FunctionComponent = () => (
    <View style={styles.grammarSection}>
        <Text style={styles.grammarTitle}>Daily Grammar</Text>
        <Text style={styles.grammarContent}>
            今天的语法：
            “虽然...但是...” (Although... but...)
            例句：虽然今天天气不好，但是我们还是去公园了。
            (Example: Although the weather is bad today, we still went to the park.)
        </Text>
    </View>
);

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
    grammarContent: {
        fontSize: 16,
        color: '#444',
        lineHeight: 22,
    },
});
