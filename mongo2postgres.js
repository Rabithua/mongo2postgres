/**
 * Convert MongoDB CSV files to Postgres CSV files
 * 
 * 1. Convert _id field to UUID & Convert key to id
 * 2. Flatten arrays and objects
 * 3. Convert arrays and objects to JSON strings
 * 4. Convert data to Postgres CSV format
 * 
 * Author: rabithua
 * link: https://github.com/rabithua
 * Date: 2024-12-19
 */

import fs from 'fs';
import csv from 'csv-parser';
import { parse } from 'json2csv';

function convertIdToUuid(id) {
    if (typeof id !== 'string' || id.length !== 24) {
        return "00000000-0000-0000-0000-000000000000";
    }

    const paddedObjectId = id.padEnd(32, '0');  // Pad with zeros to 32 characters
    return paddedObjectId.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');
}

function sanitizeString(value) {
    if (typeof value === 'string') {
        // Remove excessive double quotes
        return value.replace(/"{2,}/g, '"').replace(/^"|"$/g, '');
    }
    return value;
}

function processData(data) {
    // Clean invalid characters in data
    for (let key in data) {
        data[key] = sanitizeString(data[key]);
    }

    // Convert all _id fields to UUID
    for (let key in data) {
        if (key == '_id') {
            // convert _id to id
            data['id'] = convertIdToUuid(data[key]);
            delete data[key];
        } else if ((key.endsWith('id') || key.endsWith('Id')) && (data[key].length === 24 || data[key].length === 0)) {
            data[key] = convertIdToUuid(data[key]);
        }
    }

    // Handle flattened arrays
    for (let key in data) {
        const match = key.match(/^([^\[]+)\[(\d+)\](.*)$/);
        if (match) {
            const [, arrayName, index, rest] = match;
            if (!data[arrayName]) {
                data[arrayName] = [];
            }

            // If it's a nested property
            if (rest) {
                const nestedKey = rest.startsWith('.') ? rest.slice(1) : rest;
                if (!data[arrayName][index]) {
                    data[arrayName][index] = {};
                }
                data[arrayName][index][nestedKey] = data[key];
            } else {
                // Add to array if value is not empty
                if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
                    // Ensure array length is sufficient
                    while (data[arrayName].length <= index) {
                        data[arrayName].push(null);
                    }
                    data[arrayName][index] = data[key];
                }
            }
            delete data[key];
        }
    }

    // Clean empty values in arrays
    for (let key in data) {
        if (Array.isArray(data[key])) {
            data[key] = data[key].filter(item => item !== null && item !== undefined && item !== '');
        }
    }

    // Handle flattened objects
    const objectFields = {};
    for (let key in data) {
        const parts = key.split('.');
        if (parts.length > 1) {
            const mainKey = parts[0];
            if (!objectFields[mainKey]) {
                objectFields[mainKey] = {};
            }

            let current = objectFields[mainKey];
            for (let i = 1; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = data[key];
            data[mainKey] = current;
            delete data[key];
        }
    }

    for (let key in data) {
        if (Array.isArray(data[key]) || typeof data[key] == 'object' && data[key] !== null) {
            data[key] = JSON.stringify(data[key]);
        }
    }
}

// Tables to be converted
const arr = ['Attachment', 'Rote', 'User', 'UserOpenKey', 'UserSwSubScription']

for (let i = 0; i < arr.length; i++) {
    const results = [];
    const inputFilePath = `./mongo/Rote.${arr[i]}.csv`;
    const outputFilePath = `./mongo/Rote.${arr[i]}.Modified.csv`;

    fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', (data) => {
            processData(data);
            console.log(data);
            results.push(data);
        })
        .on('end', () => {
            // Convert results to CSV and write to file
            const csvData = parse(results);
            fs.writeFileSync(outputFilePath, csvData);
            console.log('CSV file has been successfully modified and saved.');
        });
}
