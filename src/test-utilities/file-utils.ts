import path from "path";
import fs from "fs";
import { promisify } from "util";
import pdfParse from "pdf-parse";
import { parseStringPromise } from "xml2js";
import { parse as parseCsvSync } from "csv-parse/sync";
import XLSX from "xlsx";


// PATHS

export const EXE_PATH = path.resolve('the exe');
export const GENERATED_FILE_PATH = path.resolve('generated file');

// Wait for file utility

const fileExists = promisify(fs.exists);

export async function waitForFile(filePath: string, timeoutMs = 10000): Promise<boolean> {
    const pollInterval = 500;
    const maxTries = timeoutMs / pollInterval;

    for (let i = 0; i < maxTries; i++) {
        if (await fileExists(filePath)) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    return false;
}

// PARSERS

export async function parsePdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

export async function parseXml(filePath: string): Promise<any> {
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    return parseStringPromise(xmlContent);
}

export function parseCsv(filePath: string): any[] {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    return parseCsvSync(csvContent, { columns: true });
}

export function parseXlsx(filePath: string): any[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

export function parseTxt(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
}

// Parser orchestration

export async function parseFile(filePath: string): Promise<any> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.pdf':
            return await parsePdf(filePath);
        case '.xml':
            return await parseXml(filePath);
        case '.csv':
            return parseCsv(filePath);
        case '.xlsx':
            return parseXlsx(filePath);
        case '.txt':
            return parseTxt(filePath);
        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }
}