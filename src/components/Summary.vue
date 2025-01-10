<template>
    <div class="summary">
        <h3>Summary</h3>
        <button class="button-75" @click="loadSummary">Load Summary</button>

        <div v-if="summaryData" class="summary-content">
            <div class="summary-card">
                <h4>Quiz Attempts</h4>
                <div class="stat-value">{{ summaryData.totalProgress }}</div>
                <div class="stat-label">Total Attempts</div>
            </div>
            <div class="summary-card">
                <h4>Questions Answered</h4>
                <div class="stat-value">{{ summaryData.totalQuestions }}</div>
                <div class="stat-label">Total Questions</div>
            </div>
            <div class="summary-card">
                <h4>Correct Answers</h4>
                <div class="stat-value">{{ summaryData.totalCorrect }}</div>
                <div class="stat-label">Total Correct ({{ summaryData.correctPercentage }}%)</div>
            </div>
            <div class="summary-card">
                <h4>Incorrect Answers</h4>
                <div class="stat-value">{{ summaryData.totalIncorrect }}</div>
                <div class="stat-label">Total Incorrect ({{ summaryData.incorrectPercentage }}%)</div>
            </div>

            <div class="analysis-section">
                <h3>Analysis by Quiz Set</h3>
                <div class="chart-container">
                    <Bar :data="chartData" :options="chartOptions" />
                </div>
                <div class="quiz-set-analysis">
                    <div v-for="(set, index) in summaryData.quizSetAnalysis" :key="index" class="quiz-set-card">
                        <h4>{{ set.setName }}</h4>
                        <div class="stat-row">
                            <span>Total Questions: {{ set.totalQuestions }}</span>
                            <span>Incorrect: {{ set.incorrectCount }}</span>
                            <span>Error Rate: {{ set.errorRate }}%</span>
                        </div>
                        <div class="item-chart-container">
                            <Bar :data="getItemChartData(set.itemAnalysis)" :options="itemChartOptions" />
                        </div>

                        <!-- Add answer distribution chart when an item is selected -->
                        <div v-if="selectedItem && set.items.includes(selectedItem)" class="answer-chart-container">
                            <Bar v-if="answerData" :data="answerData" :options="answerChartOptions" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="error" class="error">
            {{ error }}
        </div>
        <div v-else>
            No summary data found
        </div>
    </div>
</template>

<script>
import { getUserProgress } from '../firebase';
import { quizSets } from '../data/quizSets';
import { quizEntries } from '../data/quiz-items';
import { Bar } from 'vue-chartjs';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default {
    name: 'Summary',
    components: {
        Bar
    },
    data() {
        return {
            summaryData: null,
            error: null,
            selectedItem: null,
            answerData: null,
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const dataIndex = elements[0].index;
                        const itemId = elements[0].element.$context.dataset.itemIds[dataIndex];
                        this.selectedItem = itemId;
                    }
                }
            },
            itemChartOptions: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            beforeTitle: function (context) {
                                const itemId = context[0].dataset.itemIds[context[0].dataIndex];
                                const quizItem = quizEntries.find(q => q.id === itemId);
                                return quizItem?.Question || '';
                            },
                            label: function (context) {
                                const value = context.raw;
                                return `${context.dataset.label}: ${value}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        barThickness: 12
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const dataIndex = elements[0].index;
                        const itemId = elements[0].element.$context.dataset.itemIds[dataIndex];
                        console.log('Clicked item:', itemId);
                        this.selectedItem = itemId;
                    }
                }
            },
            answerChartOptions: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Incorrect Answer Distribution'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        barThickness: 12
                    }
                }
            }
        }
    },
    computed: {
        chartData() {
            if (!this.summaryData?.quizSetAnalysis) return null;

            return {
                labels: this.summaryData.quizSetAnalysis.map(set => set.setName),
                datasets: [
                    {
                        label: 'Error Rate',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1,
                        data: this.summaryData.quizSetAnalysis.map(set => set.errorRate)
                    },
                    {
                        label: 'Success Rate',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        data: this.summaryData.quizSetAnalysis.map(set => 100 - set.errorRate)
                    }
                ]
            };
        }
    },
    methods: {
        async loadSummary() {
            try {
                console.log('Loading summary data...');
                const progress = await getUserProgress();

                // Analyze by quiz set with item-level analysis
                const quizSetAnalysis = quizSets.map(set => {
                    // Ensure all IDs are parsed as integers
                    const setItems = set.items.map(id => parseInt(id));

                    const setQuestions = progress.flatMap(attempt =>
                        attempt.userAnswers?.filter(answer =>
                            setItems.includes(parseInt(answer.questionId))) || []);
                    const setIncorrect = progress.flatMap(attempt =>
                        attempt.incorrectQuestions?.filter(q =>
                            setItems.includes(parseInt(q.id))) || []);

                    // Analyze individual items in the set
                    const itemAnalysis = setItems.map(itemId => {
                        const itemAttempts = setQuestions.filter(q =>
                            parseInt(q.questionId) === itemId);
                        const itemIncorrect = setIncorrect.filter(q =>
                            parseInt(q.id) === itemId);

                        return {
                            itemId,
                            totalAttempts: itemAttempts.length,
                            incorrectCount: itemIncorrect.length,
                            errorRate: itemAttempts.length > 0
                                ? Math.round((itemIncorrect.length / itemAttempts.length) * 100)
                                : 0
                        };
                    });

                    return {
                        setName: set.setName,
                        items: setItems,
                        totalQuestions: setQuestions.length,
                        incorrectCount: setIncorrect.length,
                        errorRate: setQuestions.length > 0
                            ? Math.round((setIncorrect.length / setQuestions.length) * 100)
                            : 0,
                        itemAnalysis
                    };
                });

                this.summaryData = {
                    totalProgress: progress.length,
                    totalQuestions: progress.reduce((sum, attempt) =>
                        sum + (attempt.userAnswers?.length || 0), 0),
                    totalCorrect: progress.reduce((sum, attempt) =>
                        sum + ((attempt.userAnswers?.length || 0) - (attempt.incorrectQuestions?.length || 0)), 0),
                    totalIncorrect: progress.reduce((sum, attempt) =>
                        sum + (attempt.incorrectQuestions?.length || 0), 0),
                    quizSetAnalysis
                };

                // Calculate percentages
                this.summaryData.correctPercentage = this.summaryData.totalQuestions > 0
                    ? Math.round((this.summaryData.totalCorrect / this.summaryData.totalQuestions) * 100)
                    : 0;
                this.summaryData.incorrectPercentage = this.summaryData.totalQuestions > 0
                    ? Math.round((this.summaryData.totalIncorrect / this.summaryData.totalQuestions) * 100)
                    : 0;

            } catch (error) {
                console.error('Error loading summary:', error);
                this.error = error.message;
            }
        },
        getItemChartData(itemAnalysis) {
            return {
                labels: itemAnalysis.map(item => {
                    const quizItem = quizEntries.find(q => q.id === item.itemId);
                    const title = quizItem?.title || quizItem?.Question?.slice(0, 50) || `Question ${item.itemId}`;
                    return `${title} (${item.totalAttempts} attempts)`;
                }),
                datasets: [
                    {
                        label: 'Incorrect',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1,
                        data: itemAnalysis.map(item => item.errorRate),
                        itemIds: itemAnalysis.map(item => item.itemId)
                    },
                    {
                        label: 'Correct',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        data: itemAnalysis.map(item => 100 - item.errorRate),
                        itemIds: itemAnalysis.map(item => item.itemId)
                    }
                ]
            };
        },
        async getAnswerDistribution(itemId) {
            const progress = await getUserProgress();
            const quizItem = quizEntries.find(q => q.id === itemId);
            console.log('Quiz Item:', quizItem);

            // Get all answers for this question
            const answers = progress.flatMap(attempt =>
                attempt.userAnswers?.filter(answer =>
                    parseInt(answer.questionId) === itemId) || []);

            console.log('Raw answers:', answers);

            // Count incorrect answers by option
            const incorrectAnswers = answers.filter(answer => {
                console.log('Checking answer:', answer);
                let selectedAnswer = answer.answer; // Try 'answer' instead of 'selectedAnswer'
                console.log('Selected answer:', selectedAnswer);
                return selectedAnswer != quizItem.correctAnswer;
            });

            console.log('Incorrect answers:', incorrectAnswers);

            // Count occurrences of each wrong answer
            const distribution = {};
            incorrectAnswers.forEach(answer => {
                let option = answer.answer; // Try 'answer' instead of 'selectedAnswer'
                if (option) {
                    distribution[option] = (distribution[option] || 0) + 1;
                }
            });

            console.log('Distribution:', distribution);

            // Convert to percentages
            const total = incorrectAnswers.length;
            const percentages = {};
            Object.keys(distribution).forEach(key => {
                percentages[key] = Math.round((distribution[key] / total) * 100);
            });

            console.log('Percentages:', percentages);

            // Create chart data
            const chartData = {
                labels: Object.keys(percentages).map(key => {
                    const optionKey = `option${key}`;
                    const optionText = quizItem[optionKey];
                    console.log('Option lookup:', { key, optionKey, optionText });
                    return `Option ${key}: ${optionText || 'Unknown'}`;
                }),
                datasets: [{
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                    data: Object.values(percentages)
                }]
            };

            console.log('Final chart data:', chartData);

            return chartData;
        }
    },
    watch: {
        async selectedItem(newId) {
            if (newId) {
                this.answerData = await this.getAnswerDistribution(newId);
            }
        }
    }
}
</script>

<style scoped>
.summary {
    margin-top: 1rem;
}

.summary-content {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.summary-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    min-width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-card h4 {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 1rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

/* Button Styling */
.button-75 {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    display: inline-block;
    margin-bottom: 1rem;
}

.button-75:hover {
    background-color: var(--hover-bg);
    transform: translateY(-1px);
}

.button-75:active {
    transform: translateY(0);
}

/* Error State */
.error {
    color: #ff4444;
    padding: 1rem;
    border: 1px solid #ff4444;
    border-radius: 4px;
    margin: 1rem 0;
    background-color: rgba(255, 68, 68, 0.1);
}

.analysis-section {
    width: 100%;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.quiz-set-analysis {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
}

.quiz-set-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.quiz-set-card h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
}

.stat-row {
    display: flex;
    gap: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

@media (max-width: 768px) {
    .stat-row {
        flex-direction: column;
        gap: 0.5rem;
    }
}

.chart-container {
    width: 100%;
    height: 400px;
    margin: 1rem 0;
    padding: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
    .chart-container {
        height: 300px;
    }
}

.item-chart-container {
    width: 100%;
    height: 300px;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
    .item-chart-container {
        height: 400px;
    }
}

.answer-chart-container {
    width: 100%;
    height: 200px;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>