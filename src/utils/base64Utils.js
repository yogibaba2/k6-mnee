function base64ToHex(base64) {
    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64, 'base64');
    
    // Convert buffer to hex string
    return buffer.toString('hex');
}

function hexToBase64(hex) {
    // Create a buffer from the hex string
    const buffer = Buffer.from(hex, 'hex');
    
    // Convert buffer to base64 string
    return buffer.toString('base64');
}

// Example usage:
// const base64String = 'AQAAAAI5X2VKRdzk5Ub25jQE7hUN5Oe+tEtCxcMEQCy+YMjTpwIAAAC0SDBFAiEA4vnK22silSgKkZ6KfjbZX6vrvP90ce2RfP4flpt8YxsCIEb2rZyPAjaUDU2HcIKbkZxTgNhHML8mQvKNj9CQNr2UwUgwRQIhAPVX2iPutX/gfVav+tvBQnIxZsi0KBeJnmTV8o/lwaUxAiACTcKlP/yTfH+1Tp2+8cMW5/oft5z8VJQsy6Z6JHLUlMEhAzw1H140RzJEDk8pZ2ECimNNyZ4iUyrjyjaabxQJqnEq/////zam0rTd7qNQAPyaCVOLQPueJ57KhgfmceQmkCG5srxrAwAAAGpHMEQCIDSowur69iUcnH+52SEdWnLamkhSx7bHqlND7/AJB586AiAx/vGeP9Yy5HdIu7/naOcAlSupkl8gfqFbfLO999gwUEEhA8Mi0voLZfRRNL1CY9wtRGKZrnZTUwW8xiCKQmpzG4Ye/////wMBAAAAAAAAAMwAYwNvcmRREmFwcGxpY2F0aW9uL2Jzdi0yMABMcnsicCI6ImJzdi0yMCIsIm9wIjoidHJhbnNmZXIiLCJpZCI6IjY0Y2VhMTRhYjAxNjk3NWQwOTIwNjBmY2MxNGYwYTYxODZhOGNlZjBkY2M2ZDZhZTRhM2U4NjY4MTI4OWFlMTRfMCIsImFtdCI6IjEifWh2qRSvXL/3/8/cuNUWfpaEPnInW3g0k4itIQK5LC297U6BdH1NWKtBkj8ewBSsLDs322HkFAKLW9qFM6wBAAAAAAAAAM4AYwNvcmRREmFwcGxpY2F0aW9uL2Jzdi0yMABMdHsicCI6ImJzdi0yMCIsIm9wIjoidHJhbnNmZXIiLCJpZCI6IjY0Y2VhMTRhYjAxNjk3NWQwOTIwNjBmY2MxNGYwYTYxODZhOGNlZjBkY2M2ZDZhZTRhM2U4NjY4MTI4OWFlMTRfMCIsImFtdCI6IjEwMCJ9aHapFMTbg1Dk4lJSfUS1wzoXp7ip8Or9iK0hArksLb3tToF0fU1Yq0GSPx7AFKwsOzfbYeQUAotb2oUzrAEAAAAAAAAA2ABjA29yZFESYXBwbGljYXRpb24vYnN2LTIwAEx+eyJwIjoiYnN2LTIwIiwib3AiOiJ0cmFuc2ZlciIsImlkIjoiNjRjZWExNGFiMDE2OTc1ZDA5MjA2MGZjYzE0ZjBhNjE4NmE4Y2VmMGRjYzZkNmFlNGEzZTg2NjgxMjg5YWUxNF8wIiwiYW10IjoiMTIzNDQzMTYwMjE3NyJ9aHapFMDuk1v3SALDjSoxtg3Mov+RP3NniK0hArksLb3tToF0fU1Yq0GSPx7AFKwsOzfbYeQUAotb2oUzrAAAAAA=';
// const hexString = base64ToHex(base64String);
// console.log('Hex:', hexString);
// console.log('Back to base64:', hexToBase64(hexString));

export { base64ToHex, hexToBase64 };
