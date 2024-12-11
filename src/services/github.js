export const GITHUB_API_URL = 'https://api.github.com';
export const REPO_OWNER = 'EdJones';
export const REPO_NAME = 'sor-quizzes';

export const createGithubIssue = async (issueData, accessToken) => {
    try {
        const response = await fetch(
            `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: issueData.title,
                    body: issueData.body,
                    labels: issueData.labels.split(',').map(label => label.trim()).filter(Boolean)
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating GitHub issue:', error);
        throw error;
    }
};

export const getGithubIssues = async (accessToken) => {
    try {
        const response = await fetch(
            `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&sort=created&direction=desc`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub issues:', error);
        throw error;
    }
}; 