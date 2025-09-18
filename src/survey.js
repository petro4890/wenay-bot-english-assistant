const surveyQuestions = [
    {
        text: `**Question 1:**

What is your experience in crypto?

(click on one of the options below)`,
        options: [
            "1. Beginner - up to 1 year",
            "2. Intermediate - 1-3 years", 
            "3. Experienced - More than 5 years"
        ]
    },
    {
        text: `**Question 2:**

How much is your deposit?

(click on one of the options below)`,
        options: [
            "1. Less than $1,200",
            "2. $1,200–$10,000",
            "3. $10,000–$50,000", 
            "4. More than $50,000"
        ]
    },
    {
        text: `**Question 3:**

Which product are you interested in?

(click on one of the options below)`,
        options: [
            "1. Wenay bot 5-15% per month",
            "2. Wenay rebalancer up to 25% per year"
        ]
    },
    {
        text: `**Question 4:**

How did you hear about us?

(click on one of the options below)`,
        options: [
            "1. Friend's recommendation",
            "2. Advertising",
            "3. Online content",
            "4. Streams"
        ]
    }
];

module.exports = { surveyQuestions };
