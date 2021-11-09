const puppeteer = require("puppeteer");
const fs = require("fs");
(async () => {
  const searchProducts = "../searchableParams.json";
  const searchParams = "../filteredParams.json";
  const searchCoins = "../coins.json";

  const searchableProducts = JSON.parse(
    fs.readFileSync(searchProducts, "utf8")
  );
  const searchableParams = JSON.parse(fs.readFileSync(searchParams, "utf8"));
  const searchableCoins = JSON.parse(fs.readFileSync(searchCoins, "utf8"));

  function getShortName(nome) {
    let initial;

    searchableParams?.forEach((item) => {
      if (nome?.toLowerCase()?.indexOf(item?.toLowerCase()) !== -1) {
        initial = nome?.toLowerCase()?.indexOf(item?.toLowerCase());
      }
    });

    return nome?.slice(initial, initial + 14);
  }

  const searchInGoogle = async (item) => {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-notifications"],
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.goto("https://www.google.com/");
    await page.click(".gsfi");
    await page.keyboard.type(item, { delay: 500 });
    await page.keyboard.press("Enter");
    await page.waitForNavigation();

    await page.click(".MUFPAc > :nth-child(2n) > a");

    await page.waitForNavigation();

    let productList = await page.evaluate(() => {
      const nodeList = document?.querySelectorAll(".KZmu8e");

      const listObjects = [...nodeList];

      const date = new Date();
      const dia = date?.getDate()?.toString()?.padStart(2, "0");
      const mes = String(date?.getMonth() + 1)?.padStart(2, "0");
      const ano = date?.getFullYear();
      const hora = date?.getHours();
      const minutos = date?.getMinutes();
      const data = `${dia}-${mes}-${ano} : ${hora}:${minutos}`;

      const productList = listObjects?.map(({ children }) => {
        const imageURL = children[0]?.children[0]?.children[0]?.currentSrc;

        const url = children[0]?.href;
        const nome =
          children[0]?.children[2]?.children[0]?.children[0]?.innerHTML;
        const preco =
          children[0]?.children[2]?.children[0]?.children[1]?.children[0]
            ?.children[0]?.innerText;
        const loja =
          children[0]?.children[2]?.children[0]?.children[2]?.children[0]
            ?.innerText;

        return {
          nome,
          preco: preco?.replaceAll("&nbsp;", ""),
          url,
          loja,
          dataDaColeta: data,
          imageURL,
        };
      });

      return productList;
    });

    productList = productList
      ?.map((product) => {
        if (getShortName(product?.nome) !== "") {
          return product;
        }
      })
      ?.filter((e) => e);

    const file = __dirname + "/productList.json";

    const oldData = fs.readFileSync(file, "utf8", function (err, data) {
      if (err) throw err;
      if (data) {
        return JSON.parse(data);
      }
      return [];
    });

    let other;

    if (oldData) {
      other = JSON.parse(oldData);
    } else {
      other = [];
    }

    const newData = [...other, ...productList];

    const removeEquals = [];

    newData?.forEach((item) => {
      const exist = removeEquals.find(
        (e) => e?.nome === item?.nome && e?.dataDaColeta === item?.dataDaColeta
      );
      if (!exist) {
        removeEquals?.push(item);
      }
    });

    fs.writeFileSync(file, JSON.stringify(removeEquals, null, 2), (err) => {
      if (err) throw new Error("Algum erro ocorreu");

      console.log("Finalizou");
    });

    await browser.close();
  };

  const searchCoinsFunction = async ({ filterBy, saveAs }) => {
    const browser = await puppeteer.launch({
      // headless: false,
      // args: ["--disable-notifications"],
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.goto("https://www.google.com/");
    await page.click(".gsfi");
    await page.keyboard.type(filterBy, { delay: 500 });
    await page.keyboard.press("Enter");
    await page.waitForNavigation();

    const value = await page.evaluate(() => {
      const nodeList = document.getElementsByClassName("DFlfde SwHCTb");
      const date = new Date();
      const dia = date.getDate().toString().padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const ano = date.getFullYear();
      const hora = date.getHours();
      const minutos = date.getMinutes();
      const data = `${dia}-${mes}-${ano}`;

      const valor = Number(
        nodeList[0]?.innerText?.replaceAll(".", "")?.replaceAll(",", ".")
      );

      return {
        valor,
        dataDaColeta: data,
      };
    });

    const file = __dirname + saveAs;

    const oldData = fs.readFileSync(file, "utf8", function (err, data) {
      if (err) throw err;
      if (data) {
        return JSON.parse(data);
      }
      return [];
    });

    let other;

    if (oldData) {
      other = JSON.parse(oldData);
    } else {
      other = [];
    }

    const newData = [...other, value];

    const removeEquals = [];

    newData?.forEach((item) => {
      const exist = removeEquals?.find(
        (e) => e.dataDaColeta === item.dataDaColeta
      );
      if (!exist) {
        removeEquals?.push(item);
      }
    });

    fs.writeFileSync(file, JSON.stringify(removeEquals, null, 2), (err) => {
      if (err) throw new Error("Algum erro ocorreu");

      console.log("Finalizou");
    });

    await browser.close();
  };

  searchableProducts.forEach(async (item) => {
    await searchInGoogle(item);
  });

  searchableCoins.forEach(async (item) => {
    await searchCoinsFunction(item);
  });
})();
