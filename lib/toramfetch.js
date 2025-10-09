import axios from 'axios';
import fs from 'fs';
import path from 'path';

const localPaths = {
    bag: './plugins/toram/data/bag.js',
    buff: './plugins/toram/data/buff.js',
    mats: './plugins/toram/data/mats.js',
    etc: './plugins/toram/data/etc.js',
    guide: './plugins/toram/data/guide.js'
};

const saveToFile = async (filePath, dataArray) => {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    const jsContent = `const data = ${JSON.stringify(dataArray, null, 2)};\n\nexport default data;\n`;

    await fs.promises.writeFile(filePath, jsContent, 'utf8');
};

export const updateAllData = async () => {
    console.log("=== 🔄 Updating Toram data from API ===");

    try {
        const response = await axios.get(global.API("zax", "/api/toram/listall", {}, "apikey"));

        if (response.data.success && response.data.data) {
            const data = response.data.data;

            for (const key in localPaths) {
                if (data[key]) {
                    const fileNames = data[key];
                    await saveToFile(localPaths[key], fileNames);
                    console.log(`✔ ${key.toUpperCase()} updated (${fileNames.length} items)`);
                } else {
                    console.warn(`⚠ No data found for ${key.toUpperCase()}`);
                }
            }

            console.log("=== ✅ All data updated successfully ===");
        } else {
            console.error("✖ Failed to fetch data or unexpected response structure.");
        }

    } catch (err) {
        console.error("✖ Error fetching data from API:", err.message);
    }
};
