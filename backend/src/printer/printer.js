const {
    printer: Printer,
    types: PrinterTypes
} = require("node-thermal-printer");

const printer = new Printer({
    type: PrinterTypes.EPSON,

    interface: "tcp://192.168.1.100"
});

async function printReceipt(data) {

    printer.alignCenter();

    printer.println("My Shop");

    printer.drawLine();

    printer.println(data.customer);

    printer.println(data.amount);

    printer.cut();

    await printer.execute();
}

module.exports = {
    printReceipt
};