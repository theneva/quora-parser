const fs = require('fs');

const statsFilePath = './stats.json';

const seeds = [
  '/What-are-some-of-the-interesting-facts-about-India',
  '/What-are-the-top-ten-most-obscure-facts-you-know-in-psychology',
  '/What-are-some-of-the-lesser-known-and-mind-blowing-facts-about-India',
];

before(() => {
  cy.visit('https://www.quora.com');

  cy.get('input[name="email"]')
    .last()
    .click()
    .type('<redacted>') // TODO fill in this
    .blur();

  cy.get('input[name="password"]')
    .last()
    .click()
    .type('<redacted>') // TODO fill in this
    .blur();

  cy.get('input[value="Login"]')
    .click();

  seeds.map(seed => cy.visit(`https://quora.com/${seed}`));
});

let relatedArticles = [];

describe('follow articles', () => {
  let currentArticle;

  it('logs the related articles 1', async () => {
    while (true) {
      // Fetch related articles from the current article
      await cy.get('.question_related.list.side_bar .related_question a')
        .each(link => {
          const path = link.attr('href');

          // avoid duplicates (except the removed ones)
          if (path.includes('\'')) {
            return;
          }

          if (relatedArticles.includes(path)) {
            return;
          }

          relatedArticles.push(path);
        })
        .then(() => {
          const randomArticleIndex = Math.floor(Math.random() * relatedArticles.length);

          console.log('length', relatedArticles.length)

          console.log({ randomArticleIndex, relatedArticles });

          // fetch the artlce
          currentArticle = relatedArticles[randomArticleIndex];

          // remove the article from the list
          // TODO: add it to an archive of some sort to avoid duplicates
          relatedArticles.splice(randomArticleIndex, 1);

          cy.visit(`https://quora.com/${currentArticle}`);
        });

      await cy.get('.QuestionStats')
        .then(stats => {
          const views = stats.find('.ViewsRow').text();
          const asked = stats.find('.AskedRow').text();
          const mergedQuestions = stats.find('.MergedQuestionsRow').text();

          console.log({ views, asked, mergedQuestions })
          cy.readFile(statsFilePath, 'utf-8')
            .then(existingData => {
              existingData.push({ path: currentArticle, views, asked, mergedQuestions });
              cy.writeFile(statsFilePath, JSON.stringify(existingData));
            });
        });
    }
  });
});
