from flask import Flask, render_template, request, jsonify
from math import isfinite

app = Flask(__name__)

def compute_takehome(payload):
    """Pure function used by both server and client (mirrored in JS)."""
    salary = float(payload.get('salary', 0))
    frequency = payload.get('frequency', 'annual')
    federal_dependents = int(payload.get('federal_dependents', 0))
    state_dependents = int(payload.get('state_dependents', 0))
    k401 = float(payload.get('k401', 0)) / 100.0

    if salary < 0 or k401 < 0 or k401 > 1:
        raise ValueError("Invalid inputs.")

    # 401(k)
    k401_contrib = salary * k401
    taxable_income = max(salary - k401_contrib, 0)

    # --- Simplified tax estimates (transparent & adjustable) ---
    # Feel free to refine these with real tables/brackets later.
    federal_tax = max(taxable_income * 0.10 - (federal_dependents * 500), 0)
    state_tax = max(taxable_income * 0.05 - (state_dependents * 300), 0)

    net_annual_income = taxable_income - federal_tax - state_tax

    if frequency == "monthly":
        gross_income = round(salary / 12, 2)
        net_income = round(net_annual_income / 12, 2)
    elif frequency == "biweekly":
        gross_income = round(salary / 26, 2)
        net_income = round(net_annual_income / 26, 2)
    else:
        gross_income = round(salary, 2)
        net_income = round(net_annual_income, 2)

    return {
        'frequency': frequency,
        'gross_income': gross_income,
        'federal_tax': round(federal_tax, 2),
        'state_tax': round(state_tax, 2),
        'k401_contrib': round(k401_contrib, 2),
        'net_income': net_income
    }

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/api/calc", methods=["POST"])
def api_calc():
    try:
        data = request.get_json(force=True, silent=True) or request.form.to_dict()
        results = compute_takehome(data)
        return jsonify({"ok": True, "results": results})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
