from flask import send_from_directory, Response

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')

    if request.method == "POST":
        try:
            # Collect input values safely
            salary = float(request.form.get("salary", 0))
            frequency = request.form.get("frequency", "monthly")
            federal_dependents = int(request.form.get("federal_dependents", 0))
            state_dependents = int(request.form.get("state_dependents", 0))
            k401 = float(request.form.get("k401", 0)) / 100

            # Adjust salary per period
            if frequency == "biweekly":
                gross_income = salary / 26
            else:
                gross_income = salary / 12

            # Estimate tax deductions
            taxable_income = gross_income - (federal_dependents * 4300 / 12) - (state_dependents * 2500 / 12)
            taxable_income = max(taxable_income, 0)
            federal_tax = taxable_income * 0.12
            state_tax = taxable_income * 0.05
            k401_contrib = gross_income * k401
            net_income = gross_income - federal_tax - state_tax - k401_contrib

            # Summary string
            result = f"Your estimated take-home pay per {frequency} is: ${net_income:,.2f}"

            results = {
                "frequency": frequency,
                "gross_income": f"{gross_income:,.2f}",
                "federal_tax": f"{federal_tax:,.2f}",
                "state_tax": f"{state_tax:,.2f}",
                "k401_contrib": f"{k401_contrib:,.2f}",
                "net_income": f"{net_income:,.2f}"
            }

        except Exception as e:
            result = f"Error: {str(e)}"

    return render_template("index.html", result=result, results=results)

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=10000)

