«««
title: AI
»»»

# AI

1. what is ML? - study of algorithms that learn from data and work well on unseen data without explicit instructions being provided.
2. categories of machine learning algorithms - supervised learning, unsupervised learning, recommender systems, reinforcement learning.
3. supervised learning - algorithms that learn input-to-output mappings (X -> Y). example: spam filtering, speech recognition, machine translation, online advertising.
4. regression - predict a number
5. classification - predict categories
6. unsupervised learning - find patterns in data. example: form clusters like in google news.
7. another form of unsupervised learning is anomaly detection - find unusual data points.
8. yet another form of unsupervised learning is dimensionality reduction - compress data using fewer numbers.
9. linear regression: f(x) = wx + b. w and b are parameters/coeffeicients/weights. f is the hypothesis function.
10. goal is to find w and b such that y^(i) is close to y(i) for all (x(i), y(i)).
11. cost function = (sum from i=1 to i=m [(y^(i) - y(i)) * (y^ - y(i))])/2 \* m = (sum of square of errors)/2m.
12. the extra division by 2 makes future calculations easier. but the cost function can fundamentally work without it as well.
13. people can come up with their own cost functions. squared error cost function just happens to be the most used one for regression problems.
14. goal is to minimise the output of the cost function. contour plots are a good way to visualise this.
15. silver bullet for this: gradient descent.
16. w = w - alpha _ (partial derivative of cost function w.r.t. w). b = b - alpha _ (partial derivative of cost function w.r.t. b)
17. alpha = learning rate. small value means more iterations hence slow. large value can cause gradient descent to never reach the minimum.
18. w and b need to be updated simultaneously.
19. gradient descent can fundamentally cause you to end up at a local minima but in the case of linear regression, the cost function is a convex function - it will always converge to the global minimum.
20. TODO: implement linear regression from scratch in python.
