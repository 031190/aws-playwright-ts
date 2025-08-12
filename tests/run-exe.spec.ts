import {test, expect} from '@playwright/test';
import util from 'util';
import { execFile } from 'child_process';
import { EXE_PATH, GENERATED_FILE_PATH, waitForFile, parseFile } from '../src/test-utilities/file-utils';

const execFileAsync = util.promisify(execFile);

test('Run executable and parse output file', async () => {
    // Run the executable
    const { stdout, stderr } = await execFileAsync(EXE_PATH);
    console.log('Executable output:', stdout);
    console.error('Executable error:', stderr);

    // Wait for the generated file to be created
    const fileGenerated = await waitForFile(GENERATED_FILE_PATH, 15000);
    expect(fileGenerated).toBe(true);

    // Parse the generated file
    const content = await parseFile(GENERATED_FILE_PATH);

    // Assert the content of the file
    if (typeof content === 'string') {
        expect(content).toContain('Expected content in text file');
    } else {
        expect(JSON.stringify(content)).toContain('Expected content in JSON file');
    }
});