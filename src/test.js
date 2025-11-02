import exec from 'k6/execution';


 export const options = {
    discardResponseBodies: true,
    scenarios: {
        contacts: {
        executor: 'per-vu-iterations',
        vus: 10,
        iterations: 10
        },
    },
};

export default function () {

    console.log(`${__VU} -- ${__ITER}`)
    console.log((__VU * exec.test.options.iterations) + __ITER)
    // Remove rows from text file/clear file content/delete file
    // file.removeRowsBetweenValues(filepath, 2, 2);
    
}