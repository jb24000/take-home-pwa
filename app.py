
from flask import Flask, render_template, request

app = Flask(__name__)

def get_federal_tax(income, dependents):
    std_deduction = 14600
    exemption = 2000 * dependents
    taxable = max(0, income - std_deduction - exemption)

    if taxable <= 11600:
        return taxable * 0.10
    elif taxable <= 47150:
        return 1160 + (taxable - 11600) * 0.12
    elif taxable <= 100525:
        return 5427 + (taxable - 47150) * 0.22
    elif taxable <= 191950:
        return 17535 + (taxable - 100525) * 0.24
    else:
        return 41607 + (taxable - 191950) * 0.32

def get_nc_tax(income, dependents):
    std_deduction = 13500
    exemption = 2500 * dependents
    taxable = max(0, income - std_deduction - exemption)
    return taxable * 0.0499

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    if request.method == "POST":
        try:
            salary = float(request.form["salary"])
            period = request.form["pay_period"]
            dependents = int(request.form["dependents"])
            k401 = float(request.form["k401"])

            k401_contribution = salary * (k401 / 100)
            taxable_income = salary - k401_contribution

            fed = get_federal_tax(taxable_income, dependents)
            state = get_nc_tax(taxable_income, dependents)
            total_tax = fed + state
            net = taxable_income - total_tax

            if period == "monthly":
                take_home = net / 12
            else:
                take_home = net / 26

            result = {
                "salary": salary,
                "k401": k401_contribution,
                "fed": fed,
                "state": state,
                "net": net,
                "take_home": take_home,
                "period": period
            }

        except Exception as e:
            result = {"error": str(e)}

    return render_template("index.html", result=result)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
