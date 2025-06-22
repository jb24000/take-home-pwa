from flask import Flask, render_template, request, send_from_directory

app = Flask(__name__, static_url_path='/static', static_folder='static')

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            salary = float(request.form['salary'])
            frequency = request.form['frequency']
            federal_dependents = int(request.form.get('federal_dependents', 0))
            state_dependents = int(request.form.get('state_dependents', 0))
            k401 = float(request.form.get('k401', 0))

            deduction_per_federal = 4300
            deduction_per_state = 2500

            federal_tax_rate = 0.12
            state_tax_rate = 0.05

            federal_deduction = federal_dependents * deduction_per_federal
            state_deduction = state_dependents * deduction_per_state

            taxable_income = max(salary - federal_deduction - state_deduction, 0)
            federal_tax = taxable_income * federal_tax_rate
            state_tax = taxable_income * state_tax_rate
            k401_contrib = (k401 / 100) * salary
            net_income = salary - federal_tax - state_tax - k401_contrib

            results = {
                'frequency': frequency,
                'gross_income': f"{salary:,.2f}",
                'federal_tax': f"{federal_tax:,.2f}",
                'state_tax': f"{state_tax:,.2f}",
                'k401_contrib': f"{k401_contrib:,.2f}",
                'net_income': f"{net_income:,.2f}",
            }

            return render_template('index.html', results=results)
        except Exception as e:
            return render_template('index.html', result="Error: " + str(e))
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')

@app.route('/service-worker.js')
def sw():
    return send_from_directory('static', 'service-worker.js')

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 10000))
    app.run(debug=False, host='0.0.0.0', port=port)
