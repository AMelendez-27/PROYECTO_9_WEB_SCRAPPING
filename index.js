/* 
------------------------------------------------------------------------------------------
IMPORTANTE: Habría usado una búsqueda con más páginas de resultados,
pero la web que he querido usar para este proyecto te bloquea
si haces muchas peticiones muy rápidas.
------------------------------------------------------------------------------------------ 
*/

const puppeteer = require('puppeteer');
const fs = require('fs');

const scrapeCards = async (keyword) => {
  const url = `https://steamcommunity.com/market/search?appid=730&q=${keyword}`;

  const browser = await puppeteer.launch({
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  await page.goto(url);

  // Patch
  // Wait for the cookies accept btn popup to appear
  try {
    await page.waitForSelector('#cookiePrefPopup', { visible: true, timeout: 5000 });
    await page.click('#acceptAllButton');
  } catch (e) {
    // If the popup doesn't appear, continue normally
  }

  const productsArray = [];
  await repeat(page, productsArray);

  fs.writeFile("products.json", JSON.stringify(productsArray, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Data saved to products.json');
    }
  });

  await browser.close();
};

const repeat = async (page, productsArray) => {
  await page.waitForSelector('#searchResultsRows a', { visible: true });
  const products = await page.$$('#searchResultsRows a');

  for (const product of products) {
    const name = await product.$$eval('span.market_listing_item_name', nodes =>
      nodes.map(n => n.innerText)
    );
    if (name.length === 0) continue;

    const price = await product.$$eval('span.market_table_value', nodes =>
      nodes.map(n => n.innerText)
    );
    const img = await product.$$eval('div.market_listing_row img', nodes =>
      nodes.map(img => img.src)
    );

    const productData = { name, price, img };
    productsArray.push(productData);
  }

  // Check if there is a "NEXT" button and if it's disabled
  const nextButton = await page.$('#searchResults_btn_next');
  if (nextButton) {
    const isDisabled = await page.$eval('#searchResults_btn_next', btn =>
      btn.classList.contains('disabled')
    );

    if (!isDisabled) {
      // Guarda el nombre del primer producto antes de cambiar de página
      const firstProductName = await page.$eval(
        '#searchResultsRows a span.market_listing_item_name',
        el => el.innerText
      );

      await nextButton.click();

      // Espera a que el nombre del primer producto cambie (nueva página)
      await page.waitForFunction(
        (selector, oldName) => {
          const el = document.querySelector(selector);
          return el && el.innerText !== oldName;
        },
        {},
        '#searchResultsRows a span.market_listing_item_name',
        firstProductName
      );

      await page.waitForSelector('#searchResultsRows a', { visible: true });
      await repeat(page, productsArray);
    }
  }
};

scrapeCards('butterfly');

// Fetch of total number of products from the JSON file
const products = require('./products.json');
console.log('Total products:', products.length);
