<template>
    <div class="summary">
        <button @click="loadSummary" class="button-75">Refresh</button>
        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="summaryData" class="summary-content">
            <div class="summary-card">
                <h4>Unique Users</h4>
                <div class="stat-value">{{ summaryData.uniqueUsers }}</div>
                <div class="stat-label">Total Users</div>
            </div>
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

            <div class="analysis-section">
                <h3>Frequent Users</h3>
                <div class="user-engagement-table">
                    <table v-if="frequentUsers.length">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Total Attempts</th>
                                <th>Total Questions</th>
                                <th>Correct %</th>
                                <th>Quiz Sets Attempted</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in frequentUsers" :key="user.userId">
                                <td>{{ user.userId }}</td>
                                <td>{{ user.attempts }}</td>
                                <td>{{ user.totalQuestions }}</td>
                                <td>{{ user.correctPercentage }}%</td>
                                <td>{{ user.uniqueQuizSets.join(', ') }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else>No frequent users found</div>
                </div>
            </div>
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

const TEST_USER_IDS = [
    'zaM4S3yvetUssR68ycGC2rM6mf23',  // Ed Laptop
    'I7eOVyCifVfll20Nyb5uZrXnYX22',  // Ed iPhone
    '2MF5B1lDM5U46QZkfcFXEdQtjK83',  // Ed iPhone
    'KmfQrAykhVdK17QbOxSM2RwZdeB3'   // localhost - ed
];

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
            filteredProgress: [],
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
                        text: ['', ''],
                        padding: {
                            top: 10,
                            bottom: 10
                        },
                        font: {
                            size: 12
                        }
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
            if (!this.summaryData?.quizSetAnalysis) {
                return {
                    labels: [],
                    datasets: [
                        {
                            label: 'Error Rate',
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 1,
                            data: []
                        },
                        {
                            label: 'Success Rate',
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 1,
                            data: []
                        }
                    ]
                };
            }

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
        },
        frequentUsers() {
            if (!this.filteredProgress.length) return [];

            // Group progress by user
            const userStats = {};

            this.filteredProgress.forEach(attempt => {
                if (!userStats[attempt.userId]) {
                    userStats[attempt.userId] = {
                        userId: attempt.userId,
                        attempts: 0,
                        totalQuestions: 0,
                        totalCorrect: 0,
                        uniqueQuizSets: new Set()
                    };
                }

                const stats = userStats[attempt.userId];
                stats.attempts++;
                stats.totalQuestions += attempt.userAnswers?.length || 0;
                stats.totalCorrect += (attempt.userAnswers?.length || 0) - (attempt.incorrectQuestions?.length || 0);
                stats.uniqueQuizSets.add(attempt.quizId);
            });

            // Convert to array and filter for frequent users
            return Object.values(userStats)
                .filter(user => user.attempts >= 4)
                .map(user => ({
                    ...user,
                    correctPercentage: Math.round((user.totalCorrect / user.totalQuestions) * 100),
                    uniqueQuizSets: Array.from(user.uniqueQuizSets)
                }))
                .sort((a, b) => b.attempts - a.attempts);
        }
    },
    methods: {
        async loadSummary() {
            try {
                console.log('Loading summary data...');
                const progress = await getUserProgress();

                // Filter out test users
                const filteredProgress = progress.filter(p => !TEST_USER_IDS.includes(p.userId));
                console.log('Filtered out test users. Remaining entries:', filteredProgress.length);
                this.filteredProgress = filteredProgress;  // Store for other computations

                // Get unique users (excluding test users)
                const uniqueUsers = new Set(filteredProgress.map(p => p.userId)).size;

                // Analyze by quiz set with item-level analysis
                const quizSetAnalysis = quizSets
                    .filter(set => set.id !== 4)  // Exclude test-expert set
                    .map(set => {
                        // Ensure all IDs are parsed as integers
                        const setItems = set.items.map(id => parseInt(id));

                        const setQuestions = this.filteredProgress.flatMap(attempt =>
                            attempt.userAnswers?.filter(answer =>
                                setItems.includes(parseInt(answer.questionId))) || []);
                        const setIncorrect = this.filteredProgress.flatMap(attempt =>
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
                    uniqueUsers: uniqueUsers,
                    totalProgress: filteredProgress.length,
                    totalQuestions: filteredProgress.reduce((sum, attempt) =>
                        sum + (attempt.userAnswers?.length || 0), 0),
                    totalCorrect: filteredProgress.reduce((sum, attempt) =>
                        sum + ((attempt.userAnswers?.length || 0) - (attempt.incorrectQuestions?.length || 0)), 0),
                    totalIncorrect: filteredProgress.reduce((sum, attempt) =>
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
            // Filter out test users here too
            const filteredProgress = progress.filter(p => !TEST_USER_IDS.includes(p.userId));

            const quizItem = quizEntries.find(q => q.id === itemId);

            // Update chart title with quiz item info
            this.answerChartOptions.plugins.title.text = [
                quizItem.title || 'Untitled',
                quizItem.Question || ''
            ];

            // Get all answers for this question from filtered data
            const answers = filteredProgress.flatMap(attempt =>
                attempt.userAnswers?.filter(answer =>
                    parseInt(answer.questionId) === itemId) || []);

            // Find all available options (1 through 5 if they exist)
            const availableOptions = {};
            for (let i = 1; i <= 5; i++) {
                const optionKey = `option${i}`;
                if (quizItem[optionKey] && quizItem[optionKey].trim() !== '') {
                    availableOptions[i] = 0; // Initialize with 0 responses
                }
            }

            // Count all answers
            answers.forEach(answer => {
                let option = answer.selected;
                if (option) {
                    availableOptions[option] = (availableOptions[option] || 0) + 1;
                }
            });

            // Convert to percentages
            const total = answers.length || 1; // Prevent division by zero
            const percentages = {};
            Object.keys(availableOptions).forEach(key => {
                percentages[key] = Math.round((availableOptions[key] / total) * 100);
            });

            // Create chart data with different colors for correct/incorrect answers
            const chartData = {
                labels: Object.keys(availableOptions).map(key => {
                    const optionKey = `option${key}`;
                    const optionText = quizItem[optionKey];
                    const isCorrect = parseInt(key) === parseInt(quizItem.correctAnswer);
                    return `Option ${key}${isCorrect ? ' ✓' : ''}: ${optionText || 'Unknown'}`;
                }),
                datasets: [{
                    backgroundColor: Object.keys(availableOptions).map(key =>
                        parseInt(key) === parseInt(quizItem.correctAnswer)
                            ? 'rgba(75, 192, 192, 0.5)'  // Green for correct
                            : 'rgba(255, 99, 132, 0.5)'  // Red for incorrect
                    ),
                    borderColor: Object.keys(availableOptions).map(key =>
                        parseInt(key) === parseInt(quizItem.correctAnswer)
                            ? 'rgb(75, 192, 192)'  // Green for correct
                            : 'rgb(255, 99, 132)'  // Red for incorrect
                    ),
                    borderWidth: 1,
                    data: Object.values(percentages)
                }]
            };

            return chartData;
        }
    },
    watch: {
        async selectedItem(newId) {
            if (newId) {
                this.answerData = await this.getAnswerDistribution(newId);
            }
        }
    },
    mounted() {
        this.loadSummary();
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
    padding: .8rem;
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

/* Button container */
.control-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

/* Button styling */
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
    white-space: nowrap;
    /* Prevent text wrapping */
    flex: 1;
    /* Make buttons equal width */
}

@media screen and (max-width: 480px) {
    .control-buttons {
        flex-direction: column;
        /* Stack buttons vertically */
        gap: 0.5rem;
        /* Reduce gap between buttons */
    }

    .button-75 {
        width: 100%;
        /* Full width on mobile */
        padding: 0.75rem 1rem;
        /* Slightly less horizontal padding */
        font-size: 0.9rem;
        /* Slightly smaller font */
        text-align: center;
        /* Center the text */
        white-space: normal;
        /* Allow text to wrap if needed */
        min-height: 44px;
        /* Ensure consistent height and touchability */
        display: flex;
        /* For vertical centering */
        align-items: center;
        /* Center text vertically */
        justify-content: center;
        /* Center text horizontally */
    }

    .summary-card {
        padding: .8rem;
        min-width: 40%;
    }
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

.user-engagement-table {
    margin-top: 1rem;
    overflow-x: auto;
}

.user-engagement-table table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.user-engagement-table th,
.user-engagement-table td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid var(--border-color);
}

.user-engagement-table th {
    background-color: var(--bg-secondary);
    font-weight: bold;
    color: var(--text-secondary);
}

.user-engagement-table tr:nth-child(even) {
    background-color: var(--bg-secondary);
}

.user-engagement-table tr:hover {
    background-color: var(--hover-bg);
}
</style>