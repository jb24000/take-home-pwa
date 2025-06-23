from flask import send_from_directory

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

def index():
    result = None
    results = None

    if request.method == 'POST':
        try:
            salary = float(request.form['salary'])
            frequency = request.form['frequency']
            federal_dependents = int(request.form.get('federal_dependents', 0))
            state_dependents = int(request.form.get('state_dependents', 0))
            k401 = float(request.form.get('k401', 0)) / 100

            # 401(k) Contribution
            k401_contrib = salary * k401
            taxable_income = salary - k401_contrib

            # Estimate taxes
            federal_tax = taxable_income * 0.10 - (federal_dependents * 500)
            state_tax = taxable_income * 0.05 - (state_dependents * 300)
            federal_tax = max(federal_tax, 0)
            state_tax = max(state_tax, 0)

            # Net annual income
            net_annual_income = taxable_income - federal_tax - state_tax

            if frequency == "monthly":
                gross_income = round(salary / 12, 2)
                net_income = round(net_annual_income / 12, 2)
            elif frequency == "biweekly":
                gross_income = round(salary / 26, 2)
                net_income = round(net_annual_income / 26, 2)
            else:
                gross_income = salary
                net_income = round(net_annual_income, 2)

            results = {
                'frequency': frequency,
                'gross_income': gross_income,
                'federal_tax': round(federal_tax, 2),
                'state_tax': round(state_tax, 2),
                'k401_contrib': round(k401_contrib, 2),
                'net_income': net_income
            }

        except Exception as e:
            result = f"Error processing input: {str(e)}"

    return render_template('index.html', result=result, results=results)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 10000))
    app.run(debug=False, host='0.0.0.0', port=port)

