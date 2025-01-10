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
                            label: function (context) {
                                return context.dataset.label + ': ' + context.raw + '%';
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
                        stacked: true
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
                const totalQuestions = progress.reduce((sum, attempt) =>
                    sum + (attempt.userAnswers?.length || 0), 0);
                const totalIncorrect = progress.reduce((sum, attempt) =>
                    sum + (attempt.incorrectQuestions?.length || 0), 0);
                const totalCorrect = totalQuestions - totalIncorrect;
                const correctPercentage = totalQuestions > 0
                    ? Math.round((totalCorrect / totalQuestions) * 100)
                    : 0;
                const incorrectPercentage = totalQuestions > 0
                    ? Math.round((totalIncorrect / totalQuestions) * 100)
                    : 0;

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

                    // Analyze individual items in the set - show all items from the set
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
                        totalQuestions: setQuestions.length,
                        incorrectCount: setIncorrect.length,
                        errorRate: setQuestions.length > 0
                            ? Math.round((setIncorrect.length / setQuestions.length) * 100)
                            : 0,
                        itemAnalysis
                    };
                }).filter(set => set.totalQuestions > 0);

                this.summaryData = {
                    totalProgress: progress.length,
                    totalQuestions: totalQuestions,
                    totalCorrect: totalCorrect,
                    totalIncorrect: totalIncorrect,
                    correctPercentage: correctPercentage,
                    incorrectPercentage: incorrectPercentage,
                    quizSetAnalysis
                };
            } catch (error) {
                console.error('Error loading summary:', error);
                this.error = error.message;
            }
        },
        getItemChartData(itemAnalysis) {
            return {
                labels: itemAnalysis.map(item =>
                    `Question ${item.itemId}${item.totalAttempts === 0 ? ' (No attempts)' : ''}`
                ),
                datasets: [
                    {
                        label: 'Incorrect',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1,
                        data: itemAnalysis.map(item => item.errorRate)
                    },
                    {
                        label: 'Correct',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1,
                        data: itemAnalysis.map(item => 100 - item.errorRate)
                    }
                ]
            };
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
    height: 400px;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
    .item-chart-container {
        height: 500px;
    }
}
</style>