import { useState, useRef, useEffect } from "react";

// La función getZoneHelp genera la explicación según la zona y el ejercicio actual
// Así los ejemplos son siempre del ejercicio que estás haciendo
function getZoneHelp(zoneName, exercise) {
  const sol = exercise.solution;
  // Busca la línea de la solución que corresponde a esta zona
  const zone = exercise.zones.find(z => z.name === zoneName);
  let ejLine = "";
  if (zone) {
    const lines = sol.split("\n");
    for (const l of lines) {
      if (zone.check(l)) { ejLine = l.trim(); break; }
    }
  }

  // Tabla de operadores para incluir cuando sean relevantes
  const OPS = `Operadores de comparación:
  -eq  → igual (equal)
  -ne  → no igual (not equal)
  -gt  → mayor que (greater than)
  -ge  → mayor o igual (greater or equal)
  -lt  → menor que (less than)
  -le  → menor o igual (less or equal)

Operadores lógicos:
  -and → Y (ambas verdaderas)
  -or  → O (al menos una verdadera)
  -not → NO (invierte)`;

  const needsOps = /(-eq|-ne|-gt|-ge|-lt|-le|-and|-or|-not)/.test(ejLine);

  const helps = {
    "Read-Host":{
      desc:"Read-Host para la ejecución y espera a que el usuario escriba algo. Lo que escribe se guarda en la variable.",
      ej: ejLine || '$dato = Read-Host "Escribe algo"'
    },
    "Casting [int]":{
      desc:"Read-Host SIEMPRE devuelve texto (string). Si necesitas hacer operaciones matemáticas, tienes que convertirlo a número con [int] delante. Sin [int], por ejemplo 2 + 3 daría '23' (concatena texto) en vez de 5.",
      ej: ejLine || '[int]$num = Read-Host "Numero"'
    },
    "[int]":{
      desc:"Read-Host SIEMPRE devuelve texto (string). Si necesitas hacer operaciones matemáticas, tienes que convertirlo a número con [int] delante. Sin [int], por ejemplo 2 + 3 daría '23' (concatena texto) en vez de 5.",
      ej: ejLine || '[int]$num = Read-Host "Numero"'
    },
    "[int] edad":{
      desc:"[int] convierte el texto que escribe el usuario a número entero. Es necesario si luego quieres hacer cálculos con ese dato.",
      ej: ejLine || '[int]$edad = Read-Host "Tu edad"'
    },
    "Operador %":{
      desc:"% es el módulo: calcula el resto de una división. En este ejercicio, si divides un número entre 2 y el resto es 0, significa que es par.",
      ej: ejLine || '# Si $num es 8 → 8 % 2 = 0 → es par\n# Si $num es 7 → 7 % 2 = 1 → es impar'
    },
    "if/else":{
      desc:"if comprueba una condición. Si se cumple, ejecuta el primer bloque { }. Si NO se cumple, ejecuta el bloque de else { }. En este ejercicio necesitas dos caminos: uno para cuando se cumple y otro para cuando no.",
      ej: ejLine ? `# En este ejercicio:\n${sol.split("\\n").filter(l => /\b(if|else)\b/i.test(l)).slice(0,4).join("\n")}` : 'if (condición) {\n    # se cumple\n} else {\n    # no se cumple\n}'
    },
    "if/elseif/else":{
      desc:"Cuando tienes más de 2 posibilidades, usas elseif entre el if y el else. Funciona así: comprueba el if, si no se cumple comprueba el elseif, si tampoco se cumple va al else.",
      ej: ejLine ? `# En este ejercicio necesitas 3 caminos:\nif (primera condición) {\n    ...\n} elseif (segunda condición) {\n    ...\n} else {\n    ...\n}` : ""
    },
    "Salida":{
      desc:"Write-Host muestra texto en la consola. Dentro de comillas dobles \" \", las variables (con $) se reemplazan automáticamente por su valor.",
      ej: ejLine || 'Write-Host "El resultado es $variable"'
    },
    "Salida con variables":{
      desc:"Dentro de comillas dobles, PowerShell reemplaza las variables por su valor. Así puedes mezclar texto fijo con datos del usuario.",
      ej: ejLine || 'Write-Host "Hola $nombre, tienes $edad años"'
    },
    "-gt / -lt":{
      desc:"Son operadores de comparación:\n  -gt → mayor que (greater than)\n  -lt → menor que (less than)\n  -eq → igual\n  -ge → mayor o igual\n  -le → menor o igual",
      ej: ejLine || '# $a = 10, $b = 5\nif ($a -gt $b) → verdadero (10 > 5)\nif ($a -lt $b) → falso (10 < 5)'
    },
    "Llaves { }":{
      desc:"Cada { de apertura necesita su } de cierre. Cuenta cuántas { tienes y asegúrate de tener el mismo número de }. Cada if, for, while, foreach, function, switch necesita abrir { y cerrar }.",
      ej: 'if ($x -gt 0) {       ← abre\n    Write-Host "Positivo"\n}                       ← cierra\n\n# Si tienes if dentro de for:\nfor (...) {             ← abre 1\n    if (...) {          ← abre 2\n        ...             \n    }                   ← cierra 2\n}                       ← cierra 1'
    },
    "Dos Read-Host":{
      desc:"Este ejercicio necesita pedir dos datos por separado. Cada Read-Host guarda su resultado en una variable diferente.",
      ej: sol.split("\\n").filter(l => /Read-Host/i.test(l)).slice(0,2).join("\n") || '$a = Read-Host "Primer dato"\n$b = Read-Host "Segundo dato"'
    },
    "3 Read-Host":{
      desc:"Este ejercicio necesita pedir tres datos. Cada uno va en su propia variable.",
      ej: sol.split("\\n").filter(l => /Read-Host/i.test(l)).slice(0,3).join("\n")
    },
    "/ 100 conversión":{
      desc:"La altura te la dan en centímetros pero el IMC necesita metros. Para pasar de cm a metros divides entre 100. Ejemplo: 175 cm ÷ 100 = 1.75 m.",
      ej: '$alt = $cm / 100'
    },
    "Cálculo IMC":{
      desc:"La fórmula del IMC es: peso dividido entre (altura × altura). La altura debe estar en metros. Los paréntesis son importantes para que multiplique la altura primero.",
      ej: '$imc = $peso / ($alt * $alt)\n# peso=70, alt=1.75 → 70 / (1.75 * 1.75) = 22.86'
    },
    "Múltiples elseif":{
      desc:"Para el IMC necesitas varios rangos. Cada rango es un elseif. Se comprueban en orden: si el primero no se cumple, pasa al siguiente.",
      ej: 'if ($imc -lt 16) {\n    "Comer mas"\n} elseif ($imc -ge 16 -and $imc -lt 25) {\n    "Bien"\n} elseif ...'
    },
    "-and":{
      desc:"-and significa Y: las DOS condiciones deben cumplirse. Se usa para comprobar rangos (mayor que X Y menor que Y a la vez).\n\nOperadores: -eq (igual), -ne (no igual), -gt (mayor), -ge (mayor o igual), -lt (menor), -le (menor o igual)",
      ej: ejLine || '# IMC entre 16 y 25:\nif ($imc -ge 16 -and $imc -lt 25) { "Bien" }'
    },
    "-gt 0 -and % 2":{
      desc:"Necesitas comprobar DOS cosas a la vez con -and:\n  1. Que el número sea mayor que 0 → -gt 0 (greater than)\n  2. Que sea par → % 2 -eq 0 (resto de dividir entre 2 es 0)\n\n-gt significa mayor que, -eq significa igual",
      ej: 'if ($num -gt 0 -and $num % 2 -eq 0) {\n    Write-Host ("*" * $num)\n}'
    },
    'Repetir "*" * N':{
      desc:'En PowerShell puedes repetir un texto multiplicándolo por un número. "*" * 5 produce *****. Esto lo usas para dibujar la línea de asteriscos.',
      ej: '"*" * 8   # → ********\n"*" * $num  # → tantos * como valga $num'
    },
    "do/while":{
      desc:"do { } while (condición) ejecuta el bloque PRIMERO y LUEGO comprueba la condición. Si la condición es verdadera, repite. Esto garantiza que el bloque se ejecuta al menos una vez.",
      ej: ejLine ? `# En este ejercicio:\ndo {\n    $palabra = Read-Host "Introduce una palabra"\n} while ($palabra -ne "out!")  # -ne = no igual` : ""
    },
    "-ne comparación":{
      desc:'-ne significa "not equal" (no igual). El bucle sigue mientras lo que escriba el usuario NO sea igual a "out!". Cuando escriba exactamente "out!", la condición es falsa y el bucle para.',
      ej: '# -ne = not equal (no igual)\nwhile ($palabra -ne "out!")\n# Si $palabra es "hola" → -ne es verdadero → sigue\n# Si $palabra es "out!" → -ne es falso → para'
    },
    "Bucle for":{
      desc:"for tiene 3 partes separadas por ; :\n  1. Inicio: $i = 0 (empieza en 0)\n  2. Condición: $i -lt $n (mientras $i sea menor que $n, sigue)\n  3. Incremento: $i++ (suma 1 a $i cada vuelta)\n\n-lt significa menor que (less than)",
      ej: ejLine || 'for ($i = 0; $i -lt $n; $i++) {\n    Write-Host ("*" * $n)\n}'
    },
    '"*" * $n':{
      desc:'Repite el carácter * tantas veces como valga $n. Si $n es 4, produce ****. Lo usas dentro del bucle para dibujar cada fila del cuadrado.',
      ej: '# Si $n = 4:\nWrite-Host ("*" * $n)\n# Salida: ****'
    },
    "Salida en bucle":{
      desc:"Write-Host dentro del for se ejecuta en cada vuelta del bucle. Así repites la acción tantas veces como necesites.",
      ej: '# El for repite esto $n veces:\nWrite-Host ("*" * $n)\n# Resultado: un cuadrado de $n filas'
    },
    "Array @()":{
      desc:"Un array es una lista que guarda varios valores. @() crea el array. Puedes empezar vacío con @() o con valores como @(0,0,0). Accedes a cada posición con [0], [1], etc.",
      ej: ejLine || '$arr = @(0,0,0,0,0,0,0,0,0,0)  # 10 ceros\n$arr[0]  # primer elemento\n$arr[3]  # cuarto elemento'
    },
    "For lectura":{
      desc:"Un bucle for que va del 0 al 9 (10 vueltas) para que el usuario escriba un valor en cada posición del array.",
      ej: 'for ($i = 0; $i -lt 10; $i++) {\n    $array[$i] = [int](Read-Host "Elemento $i")\n}'
    },
    "Read-Host en bucle":{
      desc:"Dentro del for, cada vuelta pide un dato al usuario con Read-Host y lo guarda en la posición correspondiente del array.",
      ej: '# Vuelta 0: pide "Elemento 0" → guarda en $array[0]\n# Vuelta 1: pide "Elemento 1" → guarda en $array[1]\n# ... y así hasta el 9'
    },
    "Incremento +1":{
      desc:"Sumar 1 a cada elemento del array. Puedes hacerlo con + 1 o con ++. En este ejercicio recorres el array con un segundo for y le sumas 1 a cada posición.",
      ej: '$array[$i] = $array[$i] + 1\n# o también:\n$array[$i]++'
    },
    "Dos bucles for":{
      desc:"Este ejercicio necesita DOS bucles for separados:\n  1. El primero para LEER los 10 números del usuario\n  2. El segundo para INCREMENTAR +1 y MOSTRAR cada elemento",
      ej: '# Primer for: leer\nfor ($i = 0; $i -lt 10; $i++) { leer }\n# Segundo for: +1 y mostrar\nfor ($i = 0; $i -lt 10; $i++) { +1 y mostrar }'
    },
    "function menu":{
      desc:"Una función agrupa código que puedes reutilizar. En este ejercicio, la función menu muestra las opciones de la calculadora y devuelve lo que elija el usuario con return.",
      ej: 'function menu {\n    Write-Host "1. Suma"\n    Write-Host "2. Resta"\n    ...\n    $op = Read-Host "Opcion"\n    return $op\n}'
    },
    "function operar":{
      desc:"La función operar recibe 3 parámetros: los dos números y la operación. Según la operación elegida, hace el cálculo correspondiente.",
      ej: 'function operar ($n1, $n2, $op) {\n    switch ($op) {\n        "1" { Write-Host "Resultado: $($n1 + $n2)" }\n        "2" { Write-Host "Resultado: $($n1 - $n2)" }\n        ...\n    }\n}'
    },
    "switch o if múltiple":{
      desc:"switch compara una variable contra varios valores posibles. Cada caso tiene su bloque { }. Es más limpio que muchos if/elseif cuando comparas un valor contra opciones fijas.",
      ej: 'switch ($op) {\n    "1" { # suma }\n    "2" { # resta }\n    "3" { # multiplicación }\n    "4" { # división }\n}'
    },
    "while principal":{
      desc:"El while envuelve todo el programa para que se repita hasta que el usuario elija salir. Usa una variable $salir que empieza en $false y cambia a $true cuando elige la opción de salir.",
      ej: '$salir = $false\nwhile (-not $salir) {\n    $op = menu\n    if ($op -eq "5") { $salir = $true }\n    else { ... }\n}'
    },
    "4 operaciones":{
      desc:"La calculadora necesita las 4 operaciones básicas:\n  + → suma\n  - → resta\n  * → multiplicación\n  / → división\nCada una se ejecuta según la opción elegida en el switch.",
      ej: '$n1 + $n2   # suma\n$n1 - $n2   # resta\n$n1 * $n2   # multiplicación\n$n1 / $n2   # división'
    },
    "Get-Random":{
      desc:"Get-Random genera un número aleatorio. -Minimum es el valor mínimo (incluido) y -Maximum es el máximo (NO incluido). Por eso para obtener del 1 al 10, pones Maximum 11.",
      ej: 'Get-Random -Minimum 1 -Maximum 11\n# Puede dar: 1, 2, 3, 4, 5, 6, 7, 8, 9 o 10\n# El 11 NUNCA sale (Maximum no se incluye)'
    },
    "while con -and":{
      desc:"El bucle sigue mientras se cumplan AMBAS condiciones a la vez:\n  1. Que queden intentos → $cnt -lt $max (-lt = menor que)\n  2. Que NO haya acertado → -not $ok\nSi cualquiera deja de cumplirse, el bucle para.",
      ej: 'while ($cnt -lt $max -and -not $ok) {\n    # -lt = less than (menor que)\n    # -and = las dos deben ser verdaderas\n    # -not = invierte ($ok es $false → -not $ok es $true)\n}'
    },
    "Contador ++":{
      desc:"++ incrementa la variable en 1. Lo usas para contar cuántos intentos lleva el usuario. Empieza en 0 y cada vez que intenta, sube 1.",
      ej: '$cnt = 0       # empieza en 0\n$cnt++         # ahora vale 1\n$cnt++         # ahora vale 2'
    },
    "if/elseif pistas":{
      desc:"Después de cada intento, le dices al usuario si su número es igual, mayor o menor que el aleatorio. Así sabe hacia dónde buscar.\n\n-eq = igual, -gt = mayor que",
      ej: 'if ($int -eq $numero) {\n    # -eq = equal (igual) → ¡acertó!\n} elseif ($int -gt $numero) {\n    # -gt = greater than → su número es mayor\n    Write-Host "El aleatorio es menor"\n} else {\n    Write-Host "El aleatorio es mayor"\n}'
    },
    "Mensaje sin intentos":{
      desc:"-not invierte verdadero/falso. Si $ok sigue siendo $false (no acertó), -not $false es $true, así que entra al if y muestra que se quedó sin intentos.",
      ej: '# $ok = $false (no acertó)\nif (-not $ok) {\n    # -not $false → $true → entra aquí\n    Write-Host "Sin intentos. Era $numero"\n}'
    },
    "Get-Date":{
      desc:"Get-Date obtiene la fecha y hora actual del sistema. Devuelve un objeto con muchas propiedades como .Hour, .Day, .Month, etc.",
      ej: '$fecha = Get-Date        # fecha completa\n$hora = (Get-Date).Hour  # solo la hora (0-23)'
    },
    ".Hour":{
      desc:".Hour saca la hora (número del 0 al 23) del objeto fecha. Los paréntesis en (Get-Date) son necesarios para acceder a .Hour directamente.",
      ej: '# Si son las 14:30:\n$hora = (Get-Date).Hour  # $hora = 14\n# Si son las 8:15:\n$hora = (Get-Date).Hour  # $hora = 8'
    },
    "-and rangos":{
      desc:"Para comprobar si la hora está en un rango, necesitas -and (Y) con dos comparaciones:\n  -ge = mayor o igual (greater or equal)\n  -lt = menor que (less than)",
      ej: '# Mañana: de 6 a 11\nif ($hora -ge 6 -and $hora -lt 12) {\n    # -ge 6  → hora >= 6\n    # -lt 12 → hora < 12\n    # -and   → las dos a la vez\n}'
    },
    "* 2":{desc:"Multiplicar el número por 2 para obtener el doble.",ej: '$doble = $num * 2\n# Si $num = 7 → $doble = 14'},
    "$nombre":{desc:"Las variables en PowerShell siempre empiezan con $. Le pones el nombre que quieras después del $.",ej: '$nombre = Read-Host "Tu nombre"\n# Si escribes "Mikel" → $nombre vale "Mikel"'},
    "for":{
      desc:"for tiene 3 partes separadas por ; :\n  1. $i = 1 → empieza en 1\n  2. $i -le $n → mientras $i sea menor o igual que $n (-le = less or equal)\n  3. $i++ → suma 1 a $i cada vuelta",
      ej: ejLine || 'for ($i = 1; $i -le $n; $i++) {\n    Write-Host $i\n}\n# Si $n = 3 → muestra: 1, 2, 3'
    },
    "++":{desc:"++ suma 1 a la variable automáticamente. Es lo mismo que escribir $i = $i + 1 pero más corto.",ej: '$i = 0\n$i++    # $i = 1\n$i++    # $i = 2'},
    "-ge":{
      desc:"-ge significa mayor o igual (greater or equal). En este ejercicio lo usas para comparar cuál de los tres números es el mayor.\n\nRecuerda:\n  -ge = mayor o igual\n  -gt = mayor (sin igual)\n  -le = menor o igual\n  -lt = menor (sin igual)",
      ej: '# $a=10, $b=7, $c=10\nif ($a -ge $b -and $a -ge $c) {\n    # 10 >= 7 Y 10 >= 10 → verdadero\n}'
    },
    "for hasta 10":{
      desc:"Un for que va del 1 al 10. Se usa -le (menor o igual) para que incluya el 10.",
      ej: 'for ($i = 1; $i -le 10; $i++) {\n    # -le = less or equal (menor o igual)\n    # i va: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\n}'
    },
    "*":{desc:"* multiplica dos valores. En este ejercicio multiplicas el número del usuario por cada valor del 1 al 10.",ej: '$r = $num * $i\n# Si $num = 7 y $i = 3 → $r = 21'},
    "Salida formateada":{
      desc:"Write-Host con comillas dobles reemplaza las variables por su valor. Así puedes formatear la tabla de multiplicar.",
      ej: 'Write-Host "$num x $i = $r"\n# Si $num=7, $i=3, $r=21 → "7 x 3 = 21"'
    },
    "+= array":{desc:"+= añade un elemento al final del array. El array crece automáticamente.",ej: '$arr = @()      # array vacío\n$arr += 5       # ahora tiene: 5\n$arr += 10      # ahora tiene: 5, 10'},
    "foreach sumar":{
      desc:"foreach recorre cada elemento del array uno por uno. En cada vuelta, $n toma el valor del elemento actual. Lo usas para ir sumando todos.",
      ej: '# $arr = @(3, 7, 2)\n$suma = 0\nforeach ($n in $arr) {\n    $suma += $n  # 0+3=3, 3+7=10, 10+2=12\n}'
    },
    "foreach":{
      desc:"foreach recorre cada elemento de una lista. En cada vuelta, la variable (aquí $n) toma el valor del siguiente elemento.",
      ej: '# $nums = 1..20\nforeach ($n in $nums) {\n    # $n vale 1, luego 2, luego 3... hasta 20\n}'
    },
    "while":{
      desc:"while comprueba la condición ANTES de ejecutar. Mientras sea verdadera, repite el bloque. Cuando deja de serlo, sale.\n\n-ge = mayor o igual (greater or equal)",
      ej: '# Cuenta atrás desde $n hasta 0:\nwhile ($n -ge 0) {\n    # -ge = greater or equal (mayor o igual)\n    Write-Host $n\n    $n--\n}'
    },
    "--":{desc:"-- resta 1 a la variable. Es lo mismo que $n = $n - 1 pero más corto. Lo usas para la cuenta atrás.",ej: '$n = 5\n$n--    # $n = 4\n$n--    # $n = 3'},
    "if $n -eq 0":{
      desc:"Dentro del while, compruebas si $n ha llegado a 0. -eq significa igual (equal). Si es 0, muestras BOOM!, si no, muestras el número.",
      ej: 'if ($n -eq 0) {\n    # -eq = equal (igual)\n    Write-Host "BOOM!"\n} else {\n    Write-Host $n\n}'
    },
    "BOOM":{desc:'Cuando el contador llega a 0, muestras "BOOM!" con Write-Host.',ej: 'if ($n -eq 0) { Write-Host "BOOM!" }'},
    "Var = 1":{desc:"Para calcular factorial, empiezas con $fact = 1 (no 0, porque multiplicar por 0 siempre da 0). Luego vas multiplicando.",ej: '$fact = 1\n# 5! = 1 × 1 × 2 × 3 × 4 × 5 = 120'},
    "* acumulado":{
      desc:"En cada vuelta del for, multiplicas $fact por $i. Así acumulas el factorial. *= es lo mismo que $fact = $fact * $i.",
      ej: '# Factorial de 5:\n$fact = 1\n# i=1: $fact = 1 * 1 = 1\n# i=2: $fact = 1 * 2 = 2\n# i=3: $fact = 2 * 3 = 6\n# i=4: $fact = 6 * 4 = 24\n# i=5: $fact = 24 * 5 = 120'
    },
    "1..20":{desc:"1..20 es un atajo de PowerShell que crea un array con todos los números del 1 al 20 automáticamente.",ej: '$nums = 1..20\n# Equivale a @(1, 2, 3, 4, ... , 19, 20)'},
    "% 2":{
      desc:"% es el módulo (resto de la división). Si divides un número entre 2 y el resto es 0, es par. Si el resto es 1, es impar.\n\n-eq = equal (igual)",
      ej: '# 6 % 2 = 0 → par  (-eq 0 es verdadero)\n# 7 % 2 = 1 → impar (-eq 0 es falso)\nif ($n % 2 -eq 0) { "Es par" }'
    },
    "if":{desc:"if comprueba la condición entre paréntesis. Si es verdadera, ejecuta el bloque { }. En este ejercicio compruebas si el número es par.",ej: ejLine || 'if ($n % 2 -eq 0) {\n    Write-Host "$n es par"\n}'},
    '"*" * $i':{
      desc:"En cada vuelta del for, $i vale 1, 2, 3... Multiplicar \"*\" por $i repite el asterisco $i veces. Así cada línea tiene un asterisco más que la anterior.",
      ej: '# i=1: "*" * 1 → *\n# i=2: "*" * 2 → **\n# i=3: "*" * 3 → ***\nWrite-Host ("*" * $i)'
    },
    "switch":{
      desc:"switch compara el valor de una variable contra cada caso. Cuando encuentra una coincidencia, ejecuta ese bloque. Es como varios if/elseif pero más limpio.",
      ej: 'switch ($op) {\n    "1" { $n = Read-Host "Nombre"; Write-Host "Hola $n!" }\n    "2" { Write-Host (Get-Date) }\n    "3" { Write-Host (Get-Random -Minimum 1 -Maximum 100) }\n    "4" { Write-Host "Adios!" }\n}'
    },
    "default":{desc:"default se ejecuta cuando el valor no coincide con ningún caso. Es como el else del switch, para capturar opciones no válidas.",ej: 'switch ($op) {\n    "1" { ... }\n    "2" { ... }\n    default { Write-Host "Opcion no valida" }\n}'},
    "Salir -ne 4":{
      desc:'El while comprueba que la opción NO sea "4" (salir). -ne significa not equal (no igual). Mientras no elija 4, el menú se repite.',
      ej: '} while ($op -ne "4")\n# -ne = not equal\n# Si $op = "2" → "2" -ne "4" → verdadero → repite\n# Si $op = "4" → "4" -ne "4" → falso → sale'
    },
    "Salir -ne 5":{
      desc:'El while comprueba que la opción NO sea 5 (salir). -ne significa not equal (no igual). Mientras no elija 5, el menú se repite.',
      ej: '} while ($men -ne 5)\n# -ne = not equal\n# Si $men = 2 → 2 -ne 5 → verdadero → repite\n# Si $men = 5 → 5 -ne 5 → falso → sale'
    },
    "for llenar":{
      desc:"Un bucle for que pide un dato en cada vuelta y lo añade al array con +=.",
      ej: 'for ($i = 0; $i -lt 5; $i++) {\n    $arr += Read-Host "Palabra $($i+1)"\n}\n# Pide 5 palabras y las guarda en $arr'
    },
    "+=":{desc:"+= hace dos cosas según el contexto:\n  Con arrays: añade un elemento al final\n  Con números: suma y guarda\n  Con texto: concatena al final",ej: '$arr += "nuevo"   # añade al array\n$suma += 5        # $suma = $suma + 5\n$texto += "más"   # $texto = $texto + "más"'},
    ".Length - 1":{
      desc:"Los arrays empiezan en posición 0. Si tiene 5 elementos, van del 0 al 4. .Length da 5, pero la última posición es .Length - 1 = 4. Para recorrer al revés, empiezas ahí.",
      ej: '# $arr = @("a","b","c","d","e")\n# .Length = 5\n# Posiciones: [0]="a" [1]="b" [2]="c" [3]="d" [4]="e"\nfor ($i = $arr.Length - 1; $i -ge 0; $i--)\n# i va: 4, 3, 2, 1, 0'
    },
    "-- decremento":{desc:"$i-- resta 1 para ir hacia atrás: de 4 a 3, de 3 a 2... hasta llegar a 0. Así recorres el array al revés.",ej: '# i empieza en 4 (último)\n$i--  # i = 3\n$i--  # i = 2\n$i--  # i = 1\n$i--  # i = 0 → último elemento que muestra'},
    "for 1..30":{
      desc:"Un for que recorre del 1 al 30. Usa -le (menor o igual) para incluir el 30.",
      ej: 'for ($i = 1; $i -le 30; $i++) {\n    # -le = less or equal (menor o igual)\n    # i va: 1, 2, 3, ..., 29, 30\n}'
    },
    "% 3 y % 5":{
      desc:"% (módulo) calcula el resto. Si % 3 da 0, es múltiplo de 3. Si % 5 da 0, es múltiplo de 5.\n\n-eq = equal (igual a 0 = es divisible)",
      ej: '# 15 % 3 = 0 → múltiplo de 3  ✓\n# 15 % 5 = 0 → múltiplo de 5  ✓\n# 7 % 3 = 1 → NO múltiplo de 3 ✗'
    },
    "-and (ambos primero)":{
      desc:"¡TRUCO IMPORTANTE! Tienes que comprobar si es múltiplo de AMBOS (3 y 5) ANTES de comprobar cada uno por separado. Si no, nunca llegaría al caso FizzBuzz.\n\n-and = Y (ambas condiciones verdaderas)\n-eq = equal (igual)",
      ej: '# ORDEN CORRECTO:\nif ($i % 3 -eq 0 -and $i % 5 -eq 0) { "FizzBuzz" }  # ← PRIMERO\nelseif ($i % 3 -eq 0) { "Fizz" }\nelseif ($i % 5 -eq 0) { "Buzz" }'
    },
    "2+ elseif":{desc:"Necesitas al menos 2 elseif para cubrir los 4 casos: FizzBuzz (ambos), Fizz (solo 3), Buzz (solo 5), y else (el número).",ej: 'if (ambos) { "FizzBuzz" }\nelseif (solo 3) { "Fizz" }\nelseif (solo 5) { "Buzz" }\nelse { Write-Host $i }'},
    "FizzBuzz":{desc:'Cuando el número es divisible por 3 Y por 5 a la vez (como 15 o 30), muestras "FizzBuzz" en vez del número.',ej: '# 15 % 3 = 0 Y 15 % 5 = 0 → "FizzBuzz"\n# 30 % 3 = 0 Y 30 % 5 = 0 → "FizzBuzz"'},
    "Array chars":{
      desc:"Creas un array con los caracteres disponibles para la contraseña. Luego el programa elegirá posiciones aleatorias de este array.",
      ej: "$chars = @('a','b','c','d','$','.','&','0','8','9')\n# $chars[0] = 'a'\n# $chars[4] = '$'\n# .Length = 10"
    },
    "do-while validar":{
      desc:"do-while pide la longitud y repite si no está entre 3 y 10. Así obligas al usuario a dar un dato válido.\n\n-lt = menor que, -gt = mayor que, -or = O (una de las dos)",
      ej: 'do {\n    [int]$lon = Read-Host "Longitud (3-10)"\n} while ($lon -lt 3 -or $lon -gt 10)\n# -lt 3 → menos de 3 → no vale\n# -gt 10 → más de 10 → no vale'
    },
    "-or rango":{
      desc:"-or significa O: al menos una condición verdadera. Lo usas para rechazar valores fuera del rango.\n\n-lt = menor que (less than)\n-gt = mayor que (greater than)",
      ej: '# Si $lon = 2:\n# $lon -lt 3 → verdadero → -or → repite\n# Si $lon = 5:\n# $lon -lt 3 → falso, $lon -gt 10 → falso → sale'
    },
    "for componer":{
      desc:"El for va de 0 a la longitud elegida. En cada vuelta elige una posición aleatoria del array de caracteres y lo añade a la contraseña.",
      ej: 'for ($i = 0; $i -lt $lon; $i++) {\n    $pos = Get-Random -Minimum 0 -Maximum $chars.Length\n    $pass += $chars[$pos]  # añade el carácter elegido\n}'
    },
    "+= concatenar":{desc:"+= con texto (strings) pega el nuevo carácter al final del texto existente. Así vas construyendo la contraseña letra a letra.",ej: '$pass = ""        # empieza vacía\n$pass += "a"     # "a"\n$pass += "8"     # "a8"\n$pass += "$"     # "a8$"'},
    "Get-Random -10 a 10":{
      desc:"Get-Random con rango negativo. Minimum -10 y Maximum 11 genera números del -10 al 10. Recuerda: Maximum NO se incluye.",
      ej: 'Get-Random -Minimum -10 -Maximum 11\n# Puede dar: -10, -9, ..., 0, ..., 9, 10\n# El 11 NUNCA sale'
    },
    "for generar":{
      desc:"Un for de 10 vueltas que genera un número aleatorio en cada una y lo mete en el array.",
      ej: 'for ($i = 0; $i -lt 10; $i++) {\n    $arr += Get-Random -Minimum -10 -Maximum 11\n}\n# $arr tendrá 10 números aleatorios entre -10 y 10'
    },
    "foreach contar":{
      desc:"foreach recorre cada número del array. Con if/elseif/else decides si es positivo, negativo o cero, y sumas 1 al contador correspondiente.\n\n-gt = mayor que, -lt = menor que",
      ej: 'foreach ($n in $arr) {\n    if ($n -gt 0) { $pos++ }      # -gt = mayor que 0\n    elseif ($n -lt 0) { $neg++ }  # -lt = menor que 0\n    else { $cero++ }               # ni mayor ni menor = es 0\n}'
    },
    "3 contadores ++":{desc:"Tres variables para contar: $pos (positivos), $neg (negativos), $cero (ceros). Empiezan en 0 y ++ les suma 1 cada vez que encuentras uno de cada tipo.",ej: '$pos = 0; $neg = 0; $cero = 0\n# Si el array es @(3, -1, 0, 5, -2):\n# $pos = 2 (el 3 y el 5)\n# $neg = 2 (el -1 y el -2)\n# $cero = 1 (el 0)'},
    "Array nombres":{desc:"Un array con nombres predefinidos (hardcoded) para buscar dentro de él.",ej: '$nombres = @("Ana","Luis","Marta","Pedro","Sara")'},
    "Read-Host buscar":{desc:"Pides al usuario qué nombre quiere buscar dentro del array.",ej: '$buscar = Read-Host "Nombre a buscar"\n# Si escribe "Marta" → $buscar = "Marta"'},
    "for con .Length":{
      desc:".Length te da cuántos elementos tiene el array. Usas for de 0 a .Length - 1 para recorrer todas las posiciones.\n\n-lt = menor que (less than)",
      ej: '# $nombres tiene 5 elementos\nfor ($i = 0; $i -lt $nombres.Length; $i++)\n# -lt = less than\n# i va: 0, 1, 2, 3, 4'
    },
    "-eq comparar":{
      desc:"-eq (equal) compara si dos valores son exactamente iguales. Comparas cada nombre del array con lo que escribió el usuario.\n\n-eq = equal (igual)",
      ej: '# $buscar = "Marta"\nif ($nombres[$i] -eq $buscar) {\n    # Cuando i=2: $nombres[2] = "Marta"\n    # "Marta" -eq "Marta" → verdadero → ¡encontrado!\n}'
    },
    "$encontrado bool":{desc:"Una variable booleana ($true/$false) que indica si ya encontraste el nombre. Empieza en $false y cuando lo encuentras la cambias a $true.",ej: '$enc = $false              # aún no encontrado\n# ... dentro del for:\nif ($nombres[$i] -eq $buscar) {\n    $enc = $true           # ¡encontrado!\n}'},
    "-not si no está":{
      desc:"-not invierte verdadero/falso. Si $enc sigue siendo $false (no lo encontraste), -not $false da $true y entra al if para decir que no está.",
      ej: '# Si $enc = $false (no encontró nada):\nif (-not $enc) {\n    # -not $false → $true → entra aquí\n    Write-Host "No encontrado"\n}'
    },
    "do-while infinito":{desc:"do { } while ($true) crea un bucle infinito que solo se puede romper con break. Útil para juegos donde no sabes cuántas veces se repetirá.",ej: 'do {\n    # pedir jugada, comparar, mostrar resultado\n    if ($in -eq "salir") { break }  # sale del bucle\n} while ($true)  # siempre verdadero → repite siempre'},
    "Get-Random PC":{
      desc:"La PC elige entre 1, 2 o 3 al azar. Maximum 4 porque el máximo no se incluye. 1=Piedra, 2=Papel, 3=Tijeras.",
      ej: '$pc = Get-Random -Minimum 1 -Maximum 4\n# Puede dar: 1 (Piedra), 2 (Papel) o 3 (Tijeras)\n# El 4 NUNCA sale'
    },
    "-and -or combinar":{
      desc:"Para saber quién gana necesitas combinar condiciones:\n  -eq = equal (igual)\n  -and = Y (ambas verdaderas)\n  -or = O (al menos una verdadera)\n\nPiedra(1) gana a Tijeras(3), Papel(2) gana a Piedra(1), Tijeras(3) gana a Papel(2).",
      ej: '# Ganas si:\n($u -eq 1 -and $pc -eq 3)  # tu Piedra vs PC Tijeras\n-or\n($u -eq 2 -and $pc -eq 1)  # tu Papel vs PC Piedra\n-or\n($u -eq 3 -and $pc -eq 2)  # tu Tijeras vs PC Papel'
    },
    "break salir":{
      desc:'break rompe el bucle inmediatamente. Cuando el usuario escribe "salir", break sale del do-while sin comprobar la condición.\n\n-eq = equal (igual)',
      ej: 'if ($in -eq "salir") {\n    # -eq = equal → si escribió "salir"\n    break  # sale del do-while\n}'
    },
    "if/elseif":{
      desc:"if comprueba la primera condición. Si no se cumple, elseif comprueba la segunda. Así cubres todos los casos posibles.\n\nOperadores: -eq (igual), -gt (mayor que), -lt (menor que)",
      ej: ejLine || 'if (primera condición) { ... }\nelseif (segunda condición) { ... }\nelse { ... }'
    },
    "function calcularMedia":{
      desc:"Defines una función con function + nombre. Recibe un array de notas como parámetro. Dentro, recorre el array sumando todo y devuelve la suma dividida entre la cantidad.",
      ej: 'function calcularMedia ($notas) {\n    $s = 0\n    foreach ($n in $notas) { $s += $n }\n    return $s / $notas.Length\n}\n# Si $notas = @(8,6,7) → (8+6+7)/3 = 7'
    },
    "foreach sumar":{
      desc:"foreach recorre cada nota del array. En cada vuelta, $n toma el valor de la nota actual y la suma al acumulador $s.",
      ej: '# $notas = @(8, 6, 7)\n$s = 0\nforeach ($n in $notas) {\n    $s += $n\n}\n# Vuelta 1: $s = 0 + 8 = 8\n# Vuelta 2: $s = 8 + 6 = 14\n# Vuelta 3: $s = 14 + 7 = 21'
    },
    "return":{desc:"return devuelve un valor desde la función al código que la llamó. Es el resultado que produce la función.",ej: 'return $s / $notas.Length\n# Si $s = 21 y .Length = 3 → devuelve 7'},
    "for pedir notas":{desc:"Un bucle for de 5 vueltas para pedir cada nota al usuario. Cada nota se añade al array con +=.",ej: 'for ($i = 0; $i -lt 5; $i++) {\n    # Pide: "Nota 1", "Nota 2", ..., "Nota 5"\n    [double]$n = Read-Host "Nota $($i+1)"\n    $arr += $n\n}'},
    "do-while validar 0-10":{
      desc:"Dentro del for, un do-while valida que cada nota esté entre 0 y 10. Si no es válida, la vuelve a pedir.\n\n-lt = menor que, -gt = mayor que, -or = O",
      ej: 'do {\n    [double]$n = Read-Host "Nota (0-10)"\n} while ($n -lt 0 -or $n -gt 10)\n# -lt 0 → menos de 0 → no vale\n# -gt 10 → más de 10 → no vale\n# -or → si cualquiera es verdadera → repite'
    },
    "Llamar función":{
      desc:"¡IMPORTANTE! En PowerShell las funciones se llaman SIN paréntesis. Los parámetros van separados por espacio, no entre paréntesis.",
      ej: '# CORRECTO:\n$media = calcularMedia $arr\n\n# INCORRECTO (NO hagas esto):\n$media = calcularMedia($arr)  ← ¡MAL!'
    },
    "-ge 5 aprobado":{
      desc:"-ge significa mayor o igual (greater or equal). Si la media es >= 5, está aprobado.",
      ej: '# $media = 7\nif ($media -ge 5) {\n    # -ge = greater or equal (mayor o igual)\n    # 7 >= 5 → verdadero → "Aprobado"\n}'
    },
    "$primo bool":{desc:"Estrategia: asumes que ES primo ($true) y luego buscas un divisor. Si encuentras uno, cambias a $false. Si no encuentras ninguno, sigue siendo $true.",ej: '$primo = $true\n# Buscamos divisores...\n# Si encontramos uno → $primo = $false\n# Si no encontramos → $primo sigue $true → es primo'},
    "for desde 2":{
      desc:"Empiezas en 2 porque todo número es divisible por 1 y por sí mismo. Solo buscas divisores entre 2 y num-1.\n\n-lt = menor que (less than)",
      ej: '# Si $num = 7, buscamos divisores del 2 al 6:\nfor ($i = 2; $i -lt $num; $i++)\n# -lt = less than\n# i prueba: 2, 3, 4, 5, 6\n# 7%2=1, 7%3=1, 7%4=3, 7%5=2, 7%6=1 → ninguno da 0 → primo'
    },
    "% divisibilidad":{
      desc:"Si $num % $i da 0, significa que $i divide exactamente a $num, así que no es primo. Cuando encuentras un divisor, marcas $primo = $false y sales con break.\n\n-eq = equal (igual)",
      ej: '# $num = 12, $i = 3:\n# 12 % 3 = 0 → -eq 0 es verdadero\n# → $primo = $false → break\nif ($num % $i -eq 0) {\n    $primo = $false\n    break\n}'
    },
    "break":{desc:"break sale del for inmediatamente. Una vez que sabes que no es primo (encontraste un divisor), no necesitas seguir buscando más.",ej: '$primo = $false  # ya sabemos que no es primo\nbreak            # sale del for → ahorra tiempo'},
    "Resultado":{desc:"Al final, si $primo sigue siendo $true, no encontramos ningún divisor, así que es primo. Si es $false, encontramos al menos uno.",ej: 'if ($primo) {\n    Write-Host "$num es primo"\n} else {\n    Write-Host "$num NO es primo"\n}'},
    "+":{desc:"+ suma dos valores numéricos. Recuerda usar [int] en los Read-Host para que sume números y no concatene texto.",ej: '# Con [int]:\n[int]$a = 5; [int]$b = 3\n$a + $b  → 8\n\n# Sin [int] (¡MAL!):\n$a = "5"; $b = "3"\n$a + $b  → "53" (concatena texto)'},
    "Dos Read-Host":{
      desc:"Pides dos datos al usuario, cada uno en su variable. Si son números, usa [int] para poder operar con ellos.",
      ej: '[int]$a = Read-Host "Numero 1"\n[int]$b = Read-Host "Numero 2"\n# Ahora puedes hacer $a + $b'
    },
  };

  const h = helps[zoneName];
  if (h) return h;
  // Si no hay ayuda específica, genera una genérica con la línea de la solución
  return { desc: `Esta zona comprueba que tu código incluya: ${zoneName}.`, ej: ejLine || "" };
}

const EXERCISES = [
  // ═══ EJERCICIOS CLASE — 5.1 Entrada/Salida (13) ═══
  { id:"c1",set:"📚 Ejercicios Clase",title:"C1. Datos de usuario (variables)",
    description:"Crea un script donde recojas diferentes datos del usuario:\n- Nombre, Edad, si es mayor de edad, salario y la fecha de hoy.\nMuestra la información por pantalla. Concatena la edad con si es mayor de edad.\n(Inicializa tú las variables, sin pedir por pantalla)",
    solution:`$name = "Asier"\n[int]$age = 41\nif ($age -ge 18) {\n    $isadult = "Es mayor de edad"\n    [decimal]$salary = 1999.99\n    $today = Get-Date\n} else {\n    $isadult = "No es mayor de edad"\n}\nWrite-Host "Hola, soy $name y tengo $age años de edad, y por lo tanto soy $isadult"`,
    zones:[{name:"$nombre",check:c=>/\$name/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"-ge",check:c=>/-ge/i.test(c)},{name:"Get-Date",check:c=>/Get-Date/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["Inicializa $name, $age directamente","if ($age -ge 18) para comprobar mayoría de edad","Get-Date para la fecha actual"]},
  { id:"c2",set:"📚 Ejercicios Clase",title:"C2. Datos de usuario (Read-Host)",
    description:"Igual que el ejercicio anterior, pero pidiendo los datos por pantalla con Read-Host en lugar de inicializar tú las variables.",
    solution:`$name = Read-Host "Introduce tu nombre"\n[int]$age = Read-Host "Cuantos años tienes?"\nif ($age -ge 18) {\n    $isadult = "Es mayor de edad"\n    [decimal]$salary = Read-Host "Cuanto cobras?"\n    $today = Get-Date\n} else {\n    $isadult = "No es mayor de edad"\n}\nWrite-Host "Hola, soy $name y tengo $age años de edad, y por lo tanto soy $isadult"`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"-ge",check:c=>/-ge/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$name = Read-Host para pedir nombre","[int]$age = Read-Host para pedir edad como número"]},
  { id:"c3",set:"📚 Ejercicios Clase",title:"C3. Parámetros con $args",
    description:"Realiza el ejercicio anterior pero recibiendo los datos como argumentos por consola.\nInvestiga cómo acceder a ellos mediante el array especial $args.",
    solution:`$name = $args[0]\n[int]$age = $args[1]\n[decimal]$salary = $args[2]\n$fecha = Get-Date\nif ($age -ge 18) {\n    $isadult = "mayor de edad"\n} else {\n    $isadult = "menor de edad"\n}\nWrite-Host "Hola, soy $name y tengo $age años de edad, y por lo tanto soy $isadult. Gano un salario total de $salary a dia $fecha"`,
    zones:[{name:"$nombre",check:c=>/\$args\[0\]/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"-ge",check:c=>/-ge/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$args[0] es el primer argumento","$args[1] el segundo, etc.","Se ejecuta: .\\script.ps1 Asier 41 2000"]},
  { id:"c4",set:"📚 Ejercicios Clase",title:"C4. Calculadora básica",
    description:"Realiza una calculadora que muestre la suma, resta, multiplicación, división y módulo de dos operandos que pedirás por pantalla.",
    solution:`[int]$num1 = Read-Host "Introduce un numero"\n[int]$num2 = Read-Host "Introduce otro numero"\nWrite-Host "Suma:" ($num1 + $num2)\nWrite-Host "Resta:" ($num1 - $num2)\nWrite-Host "Multiplicacion:" ($num1 * $num2)\nWrite-Host "Division:" ($num1 / $num2)\nWrite-Host "Modulo:" ($num1 % $num2)`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"+",check:c=>/\$num1\s*\+\s*\$num2/i.test(c)},{name:"*",check:c=>/\$num1\s*\*\s*\$num2/i.test(c)},{name:"Operador %",check:c=>/\$num1\s*%\s*\$num2/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["[int] para que sume números, no texto","Las 5 operaciones: + - * / %"]},
  { id:"c5",set:"📚 Ejercicios Clase",title:"C5. Comparar números y strings",
    description:"Pide dos números y comprueba:\n- Que el segundo es mayor que el primero (si no, error).\nSi se cumple:\n- Muestra el resultado de la división y su tipo.\n- Solicita dos cadenas, mostrando la de mayor longitud.",
    solution:`[int]$num1 = Read-Host "Introduce un numero"\n[int]$num2 = Read-Host "Introduce otro numero"\nif ($num1 -gt $num2) {\n    Write-Host "NUM2 es menor o igual que NUM1, vuelva a lanzar el programa"\n} else {\n    Write-Host ($num2 / $num1)\n    Write-Host ($num2 / $num1).GetType()\n    $nombre1 = Read-Host "Introduce un nombre"\n    $nombre2 = Read-Host "Introduce otro nombre"\n    if ($nombre1.Length -gt $nombre2.Length) {\n        Write-Host "El primer nombre $nombre1 tiene mas caracteres"\n    } else {\n        Write-Host "El segundo nombre $nombre2 tiene mas o los mismos caracteres"\n    }\n}`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"-gt / -lt",check:c=>/-gt/i.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:".Length",check:c=>/\.Length/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["-gt para comparar números","(.GetType() muestra el tipo",".Length para longitud de cadena"]},
  { id:"c6",set:"📚 Ejercicios Clase",title:"C6. Bucle FOR par",
    description:"Solicita un número, verifica que es par y programa un bucle para que muestre un mensaje por consola tantas veces como indique el número.\nUtiliza las tres estructuras de bucle que conoces (for, while, do-while).",
    solution:`[int]$num = Read-Host "Introduce un numero"\nif ($num % 2 -ne 0) {\n    Write-Host "$num es impar"\n} else {\n    Write-Host "$num es par"\n    for ($cnt = 0; $cnt -lt $num; $cnt++) {\n        Write-Host "Mensaje $cnt de $num"\n    }\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"Operador %",check:c=>/%\s*2/.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["% 2 -ne 0 → es impar","for ($cnt = 0; $cnt -lt $num; $cnt++)"]},
  { id:"c7",set:"📚 Ejercicios Clase",title:"C7. Validar rango 1-100",
    description:"Solicita un número. Mientras no esté entre 1 y 100, vuelve a pedirlo.\nSi cometió errores, muestra un mensaje de queja tantas veces como errores.\nSi acertó a la primera, felicítalo.",
    solution:`$cnt = -1\ndo {\n    [int]$num = Read-Host "Introduce un numero entre 1 y 100"\n    $cnt++\n} while ($num -lt 1 -or $num -gt 100)\nif ($cnt -eq 0) {\n    Write-Host "Enhorabuena, numero valido a la primera"\n} else {\n    for ($cnt2 = 0; $cnt2 -lt $cnt; $cnt2++) {\n        Write-Host "Has fallado $cnt veces"\n    }\n}`,
    zones:[{name:"do/while",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"-or rango",check:c=>/-or/i.test(c)},{name:"Contador ++",check:c=>/\+\+/.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)}],
    hints:["do { pedir } while ($num -lt 1 -or $num -gt 100)","Contador $cnt empieza en -1 para no contar el primer intento"]},
  { id:"c8",set:"📚 Ejercicios Clase",title:"C8. Parámetros y bucle",
    description:"Crea un script que espere dos parámetros: $primero ([int]) y $segundo (String).\nSi $segundo no se introduce, debe solicitarlo al usuario.\nMuestra $segundo tantas veces como indique $primero con un for.",
    solution:`[int]$primero = $args[0]\n$segundo = $args[1]\nwhile ($segundo -eq $null) {\n    $segundo = Read-Host "Introduce algo"\n}\nfor ($cnt = 0; $cnt -lt $primero; $cnt++) {\n    Write-Host $segundo\n}`,
    zones:[{name:"$nombre",check:c=>/\$args\[0\]/i.test(c)},{name:"while",check:c=>/\bwhile\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$args[0] y $args[1] para recibir parámetros","while ($segundo -eq $null) para validar"]},
  { id:"c9",set:"📚 Ejercicios Clase",title:"C9. Array de motos",
    description:"Crea un array con los nombres de tus 5 motos favoritas.\nAñade otra moto al array.\nMuestra las motos recorriéndolas con while, for y foreach.",
    solution:`$motos = @("CB650R","MT07","DUKE 790","Husqvarna 450","Suzuki DRZ400")\n$moto_nueva = Read-Host "Introduce un modelo de moto"\n$motos += $moto_nueva\nforeach ($moto in $motos) {\n    Write-Host "Moto: $moto"\n}\nfor ($cnt = 0; $cnt -lt $motos.Length; $cnt++) {\n    Write-Host "Posicion $cnt :" $motos[$cnt]\n}\n$cnt = 0\nwhile ($cnt -lt $motos.Length) {\n    Write-Host $motos[$cnt]\n    $cnt++\n}`,
    zones:[{name:"Array @()",check:c=>/@\(/.test(c)},{name:"+= array",check:c=>/\+=/.test(c)},{name:"foreach",check:c=>/\bforeach\b/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)},{name:"while",check:c=>/\bwhile\b/i.test(c)},{name:".Length",check:c=>/\.Length/i.test(c)}],
    hints:["@(\"moto1\",\"moto2\",...) para crear el array","$motos += $nueva para añadir","3 bucles: foreach, for, while"]},
  { id:"c10",set:"📚 Ejercicios Clase",title:"C10. Array aleatorio ±10",
    description:"Define un array de 10 números inicializados a 0.\nRellénalo con números aleatorios entre -10 y 10.\nCuenta cuántos son positivos, negativos e iguales a 0.",
    solution:`$nums = @(0,0,0,0,0,0,0,0,0,0)\nfor ($cnt = 0; $cnt -lt $nums.Length; $cnt++) {\n    $nums[$cnt] = Get-Random -Maximum 11 -Minimum -10\n}\n$positivo = 0\n$negativo = 0\nfor ($cnt = 0; $cnt -lt $nums.Length; $cnt++) {\n    if ($nums[$cnt] -gt 0) {\n        $positivo++\n    } else {\n        $negativo++\n    }\n}\nWrite-Host "Positivos: $positivo Negativos: $negativo Ceros:" (($positivo + $negativo) - $nums.Length)\nWrite-Host $nums`,
    zones:[{name:"Array @()",check:c=>/@\(/.test(c)},{name:"Get-Random -10 a 10",check:c=>/Get-Random/i.test(c)&&/-10/.test(c)},{name:"for generar",check:c=>/\bfor\b/i.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)},{name:"Contador ++",check:c=>/\+\+/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["Get-Random -Maximum 11 -Minimum -10","Dos bucles for: uno para llenar, otro para contar"]},
  { id:"c11",set:"📚 Ejercicios Clase",title:"C11. Crear directorios",
    description:"Solicita un nombre de directorio. Créalo y entra en él.\nDentro, crea 10 directorios con nombre aleatorio.\nDentro de cada uno, crea 10 ficheros .txt con nombre aleatorio.\nUsa: md, cd, ni (New-Item), Get-Random, gci -recurse.",
    solution:`$ruta = Read-Host "Ruta absoluta C:\\Users\\...\\prueba"\nmd $ruta\ncd $ruta\nfor ($cnt = 0; $cnt -lt 10; $cnt++) {\n    $subfolder = Get-Random\n    md $subfolder\n    cd $subfolder\n    for ($cnt2 = 0; $cnt2 -lt 10; $cnt2++) {\n        ni "$(Get-Random).txt"\n    }\n    cd ..\n}\ngci -recurse $ruta`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)},{name:"Get-Random",check:c=>/Get-Random/i.test(c)},{name:"Salida",check:c=>/md|mkdir|New-Item/i.test(c)}],
    hints:["md crea directorio, cd entra en él","ni \"nombre.txt\" crea un archivo","Get-Random genera nombres únicos"]},
  { id:"c12",set:"📚 Ejercicios Clase",title:"C12. Generador de contraseñas",
    description:"Tienes un array: ('a','b','c','d','$','.','&','0','8','9').\nSolicita longitud (entre 3 y 10); si no es válida, vuelve a pedir.\nCompón la contraseña carácter a carácter eligiendo posiciones aleatorias del array.",
    solution:`$caracteres = @("a","b","c","d","$",".","&",0,8,9)\ndo {\n    [int]$longitud = Read-Host "Longitud (3-10)"\n} while ($longitud -lt 3 -or $longitud -gt 10)\n$contraseña = ""\nfor ($cnt = 0; $cnt -lt $longitud; $cnt++) {\n    $nuevo = Get-Random -Maximum 10 -Minimum 0\n    $contraseña += $caracteres[$nuevo]\n}\nWrite-Host $contraseña`,
    zones:[{name:"Array chars",check:c=>/@\(/.test(c)},{name:"do-while validar",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"-or rango",check:c=>/-or/i.test(c)},{name:"Get-Random",check:c=>/Get-Random/i.test(c)},{name:"for componer",check:c=>/\bfor\b/i.test(c)},{name:"+= concatenar",check:c=>/\+=/.test(c)}],
    hints:["do { pedir } while ($lon -lt 3 -or $lon -gt 10)","Get-Random para elegir posición del array","$pass += $caracteres[$pos] para construir"]},
  { id:"c14",set:"📚 Ejercicios Clase",title:"C14. Menú gestión directorios",
    description:"Muestra un menú con 4 opciones:\n1. Crear directorio\n2. Eliminar directorio\n3. Mostrar contenido\n4. Salir\nPide la ruta y ejecuta la operación elegida.\nRepite hasta que elija salir.",
    solution:`do {\n    [int]$opcion = Read-Host "1.Crear 2.Eliminar 3.Visualizar 4.Salir"\n    $ruta = Read-Host "Introduce una ruta"\n    if ($opcion -eq 1) {\n        md $ruta\n        ls $ruta\n    } elseif ($opcion -eq 2) {\n        rm $ruta\n    } else {\n        ls $ruta\n    }\n} while ($opcion -ne 4)`,
    zones:[{name:"do/while",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"if/elseif",check:c=>/\bif\b/i.test(c)&&/\belseif\b/i.test(c)},{name:"-eq comparar",check:c=>/-eq/i.test(c)},{name:"-ne comparación",check:c=>/-ne/i.test(c)}],
    hints:["do { menú + operación } while ($opcion -ne 4)","md crea, rm elimina, ls muestra"]},
  // ═══ REPASO BÁSICO (8) ═══
  { id:"r1",set:"📘 Repaso Básico",title:"1. OddOrEven",
    description:"Crea un script que solicite un número entero y muestre si es par o impar. Usa el operador %.",
    solution:`[int]$num = Read-Host "Introduce un numero entero"\nif ($num % 2 -eq 0) {\n    Write-Host "El numero $num es par"\n} else {\n    Write-Host "El numero $num es impar"\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"Casting [int]",check:c=>/\[int\]/i.test(c)},{name:"Operador %",check:c=>/%/.test(c)},{name:"if/else",check:c=>/\bif\b/i.test(c)&&/\belse\b/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["[int]$num = Read-Host para pedir","$num % 2 -eq 0 → par"]},
  { id:"r2",set:"📘 Repaso Básico",title:"2. PositiveNegativeOrZero",
    description:"Solicita un entero y muestra si es positivo, negativo o 0.",
    solution:`[int]$num = Read-Host "Introduce un numero"\nif ($num -gt 0) {\n    Write-Host "Positivo"\n} elseif ($num -lt 0) {\n    Write-Host "Negativo"\n} else {\n    Write-Host "Es 0"\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/elseif/else",check:c=>/\bif\b/i.test(c)&&/\belseif\b/i.test(c)},{name:"-gt / -lt",check:c=>/-gt/i.test(c)&&/-lt/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["-gt 0 → positivo","-lt 0 → negativo","else → es 0"]},
  { id:"r3",set:"📘 Repaso Básico",title:"3. CompareNumbers",
    description:"Solicita dos enteros, compáralos y muestra si uno es mayor o si son iguales.",
    solution:`[int]$a = Read-Host "Primer numero"\n[int]$b = Read-Host "Segundo numero"\nif ($a -gt $b) {\n    Write-Host "$a es mayor"\n} elseif ($a -lt $b) {\n    Write-Host "$b es mayor"\n} else {\n    Write-Host "Son iguales"\n}`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/elseif/else",check:c=>/\bif\b/i.test(c)&&/\belseif\b/i.test(c)},{name:"-gt / -lt",check:c=>/-gt/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["Lee dos números por separado","Usa if/elseif/else para 3 casos"]},
  { id:"r4",set:"📘 Repaso Básico",title:"4. IMC",
    description:"Pide peso (kg) y altura (cm). Calcula IMC = peso / altura².\n• <16 → \"You need to eat more\"\n• 16-25 → \"You are fine\"\n• 25-30 → \"You are eating too much\"\n• >=30 → \"Go to hospital\"",
    solution:`[double]$peso = Read-Host "Peso en kilos"\n[double]$cm = Read-Host "Altura en cm"\n$alt = $cm / 100\n$imc = $peso / ($alt * $alt)\nWrite-Host "IMC: $imc"\nif ($imc -lt 16) {\n    Write-Host "You need to eat more"\n} elseif ($imc -ge 16 -and $imc -lt 25) {\n    Write-Host "You are fine"\n} elseif ($imc -ge 25 -and $imc -lt 30) {\n    Write-Host "You are eating too much"\n} else {\n    Write-Host "Go to hospital"\n}`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"/ 100 conversión",check:c=>/\/\s*100/.test(c)},{name:"Cálculo IMC",check:c=>/\/.*\(.*\*/.test(c)},{name:"Múltiples elseif",check:c=>(c.match(/elseif/gi)||[]).length>=2},{name:"-and",check:c=>/-and/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["Divide cm entre 100 para metros","IMC = $peso / ($alt * $alt)","Usa -and para rangos"]},
  { id:"r5",set:"📘 Repaso Básico",title:"5. DrawStars",
    description:"Pide un número. Si es >0 Y par → muestra \"*\" repetido ese número de veces.\nEj: 8 → ********\nSi no cumple → \"El valor no es válido\"",
    solution:`[int]$num = Read-Host "Numero"\nif ($num -gt 0 -and $num % 2 -eq 0) {\n    Write-Host ("*" * $num)\n} else {\n    Write-Host "El valor introducido no es valido"\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"-gt 0 -and % 2",check:c=>/-gt/i.test(c)&&/%/i.test(c)&&/-and/i.test(c)},{name:"Repetir \"*\" * N",check:c=>/"\*"\s*\*/.test(c)||/'\*'\s*\*/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$num -gt 0 -and $num % 2 -eq 0","\"*\" * $num repite el asterisco"]},
  { id:"r6",set:"📘 Repaso Básico",title:"6. DoWhile",
    description:"Solicita una palabra. Mientras NO sea \"out!\" sigue pidiendo.",
    solution:`do {\n    $palabra = Read-Host "Introduce una palabra"\n} while ($palabra -ne "out!")`,
    zones:[{name:"do/while",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"-ne comparación",check:c=>/-ne/i.test(c)}],
    hints:["do { ... } while (condición)","Condición: -ne \"out!\""]},
  { id:"r7",set:"📘 Repaso Básico",title:"7. DrawSquare",
    description:"Pide un número N y dibuja un cuadrado de N×N asteriscos.\nEj 4:\n****\n****\n****\n****",
    solution:`[int]$n = Read-Host "Numero"\nfor ($i = 0; $i -lt $n; $i++) {\n    Write-Host ("*" * $n)\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"Bucle for",check:c=>/\bfor\s*\(/i.test(c)},{name:"\"*\" * $n",check:c=>/"\*"\s*\*/.test(c)||/'\*'\s*\*/.test(c)},{name:"Salida en bucle",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["\"*\" * $n → línea de asteriscos","for repite la línea N veces"]},
  { id:"r8",set:"📘 Repaso Básico",title:"8. IncrementArray",
    description:"Array de 10 números a 0. Bucle para que el usuario introduzca cada uno. Otro bucle que incremente +1 y muestre.",
    solution:`$array = @(0,0,0,0,0,0,0,0,0,0)\nfor ($i = 0; $i -lt 10; $i++) {\n    $array[$i] = [int](Read-Host "Elemento $i")\n}\nfor ($i = 0; $i -lt 10; $i++) {\n    $array[$i] = $array[$i] + 1\n    Write-Host "Elemento $i : $($array[$i])"\n}`,
    zones:[{name:"Array @()",check:c=>/@\(/.test(c)},{name:"For lectura",check:c=>/\bfor\b/i.test(c)},{name:"Read-Host en bucle",check:c=>/Read-Host/i.test(c)},{name:"Incremento +1",check:c=>/\+\s*1|\+\+/.test(c)},{name:"Dos bucles for",check:c=>(c.match(/\bfor\s*\(/gi)||[]).length>=2}],
    hints:["$array = @(0,0,0,0,0,0,0,0,0,0)","Primer for: Read-Host → $array[$i]","Segundo for: +1 y muestra"]},
  // ═══ REPASO EV3 (3) ═══
  { id:"e1",set:"📗 Repaso Ev3",title:"1. Calculadora",
    description:"Calculadora con suma, resta, multiplicación, división.\nMuestra un menú con las opciones.\nPide dos números y opera según la elección.\nRepite con do/while hasta que elija salir.",
    solution:`do {\n    [int]$men = Read-Host "Calculadora 1.Sumar 2.Restar 3.Multiplicar 4.Dividir 5.Salir"\n    if ($men -ne 5) {\n        [double]$num1 = Read-Host "Primer numero"\n        [double]$num2 = Read-Host "Segundo numero"\n        if ($men -eq 1) {\n            Write-Host "Resultado: $($num1 + $num2)"\n        } elseif ($men -eq 2) {\n            Write-Host "Resultado: $($num1 - $num2)"\n        } elseif ($men -eq 3) {\n            Write-Host "Resultado: $($num1 * $num2)"\n        } elseif ($men -eq 4) {\n            Write-Host "Resultado: $($num1 / $num2)"\n        } else {\n            Write-Host "Opcion no valida"\n        }\n    }\n} while ($men -ne 5)`,
    zones:[{name:"do/while",check:c=>/\bdo\s*\{/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"-ne comparación",check:c=>/\-ne\s+5/i.test(c)},{name:"Dos Read-Host",check:c=>/Read-Host\s*"Primer/i.test(c)},{name:"3 Read-Host",check:c=>/Read-Host\s*"Segundo/i.test(c)},{name:"if/elseif/else",check:c=>/-eq\s+1/i.test(c)},{name:"+",check:c=>/\$num1\s*\+\s*\$num2/i.test(c)},{name:"if/elseif",check:c=>/-eq\s+2/i.test(c)},{name:"Salida",check:c=>/\$num1\s*-\s*\$num2/i.test(c)},{name:"*",check:c=>/-eq\s+3/i.test(c)},{name:"4 operaciones",check:c=>/\$num1\s*\*\s*\$num2/i.test(c)},{name:"Salida con variables",check:c=>/-eq\s+4/i.test(c)},{name:"Salida en bucle",check:c=>/\$num1\s*\/\s*\$num2/i.test(c)},{name:"Salir -ne 5",check:c=>/\}\s*while\s*\(/i.test(c)}],
    hints:["do { ... } while ($men -ne 5) para repetir","[int]$men = Read-Host para el menú","if/elseif para cada operación: -eq 1, -eq 2..."]},
  { id:"e2",set:"📗 Repaso Ev3",title:"2. Adivinar número",
    description:"Genera aleatorio 1-10. Pide nº de intentos. Bucle hasta adivinar o sin intentos. Indica si el número es menor/mayor/acertado.",
    solution:`$numero = Get-Random -Minimum 1 -Maximum 11\n$max = [int](Read-Host "Numero de intentos")\n$cnt = 0\n$ok = $false\nwhile ($cnt -lt $max -and -not $ok) {\n    $int = [int](Read-Host "Tu numero")\n    $cnt++\n    if ($int -eq $numero) {\n        Write-Host "Acertaste en $cnt intentos"\n        $ok = $true\n    } elseif ($int -gt $numero) {\n        Write-Host "El aleatorio es menor"\n    } else {\n        Write-Host "El aleatorio es mayor"\n    }\n}\nif (-not $ok) { Write-Host "Sin intentos. Era $numero" }`,
    zones:[{name:"Get-Random",check:c=>/Get-Random/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"while con -and",check:c=>/\bwhile\b/i.test(c)&&/-and/i.test(c)},{name:"Contador ++",check:c=>/\+\+/.test(c)},{name:"if/elseif pistas",check:c=>/\bif\b/i.test(c)&&/\belseif\b/i.test(c)},{name:"Mensaje sin intentos",check:c=>/-not/i.test(c)}],
    hints:["Get-Random -Minimum 1 -Maximum 11","while ($cnt -lt $max -and -not $ok)","Compara con -eq, -gt, -lt"]},
  { id:"e3",set:"📗 Repaso Ev3",title:"3. Saludo según hora",
    description:"Según la hora del sistema: buenos días (6-12), buenas tardes (12-20), buenas noches (resto).",
    solution:`$hora = (Get-Date).Hour\nWrite-Host "Hora: $hora"\nif ($hora -ge 6 -and $hora -lt 12) {\n    Write-Host "Buenos dias"\n} elseif ($hora -ge 12 -and $hora -lt 20) {\n    Write-Host "Buenas tardes"\n} else {\n    Write-Host "Buenas noches"\n}`,
    zones:[{name:"Get-Date",check:c=>/Get-Date/i.test(c)},{name:".Hour",check:c=>/\.Hour/i.test(c)},{name:"if/elseif/else",check:c=>/\belseif\b/i.test(c)},{name:"-and rangos",check:c=>/-and/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$hora = (Get-Date).Hour","6-12 mañana, 12-20 tarde, resto noche"]},
  // ═══ FÁCILES (5) ═══
  { id:"f1",set:"🟢 Fácil",title:"F1. Doble de un número",description:"Pide un número y muestra su doble.",
    solution:`[int]$num = Read-Host "Numero"\n$doble = $num * 2\nWrite-Host "El doble es $doble"`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"* 2",check:c=>/\*\s*2/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$doble = $num * 2"]},
  { id:"f2",set:"🟢 Fácil",title:"F2. Saludo personalizado",description:"Pide nombre y edad. Muestra: \"Hola [nombre], tienes [edad] años\".",
    solution:`$nombre = Read-Host "Tu nombre"\n[int]$edad = Read-Host "Tu edad"\nWrite-Host "Hola $nombre, tienes $edad años"`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"$nombre",check:c=>/\$nombre/i.test(c)},{name:"[int] edad",check:c=>/\[int\]/i.test(c)},{name:"Salida con variables",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$nombre = Read-Host y [int]$edad = Read-Host"]},
  { id:"f3",set:"🟢 Fácil",title:"F3. Contar hasta N",description:"Pide N. Muestra los números del 1 al N con un for.",
    solution:`[int]$n = Read-Host "Hasta que numero"\nfor ($i = 1; $i -le $n; $i++) {\n    Write-Host $i\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"for",check:c=>/\bfor\s*\(/i.test(c)},{name:"++",check:c=>/\+\+/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["for ($i = 1; $i -le $n; $i++)"]},
  { id:"f4",set:"🟢 Fácil",title:"F4. Suma de dos números",description:"Pide dos números y muestra la suma. ¡Casting! Sin él se concatenan como strings.",
    solution:`[int]$a = Read-Host "Numero 1"\n[int]$b = Read-Host "Numero 2"\nWrite-Host "Suma: $($a + $b)"`,
    zones:[{name:"Dos Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=2},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"+",check:c=>/\+/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["Sin [int] el + concatena en vez de sumar"]},
  { id:"f5",set:"🟢 Fácil",title:"F5. Mayor de tres números",description:"Pide tres números. Muestra cuál es el mayor.",
    solution:`[int]$a = Read-Host "Num 1"\n[int]$b = Read-Host "Num 2"\n[int]$c = Read-Host "Num 3"\nif ($a -ge $b -and $a -ge $c) {\n    Write-Host "Mayor: $a"\n} elseif ($b -ge $c) {\n    Write-Host "Mayor: $b"\n} else {\n    Write-Host "Mayor: $c"\n}`,
    zones:[{name:"3 Read-Host",check:c=>(c.match(/Read-Host/gi)||[]).length>=3},{name:"[int]",check:c=>/\[int\]/i.test(c)},{name:"if/elseif",check:c=>/\belseif\b/i.test(c)},{name:"-and",check:c=>/-and/i.test(c)},{name:"-ge",check:c=>/-ge/i.test(c)}],
    hints:["Compara cada uno contra los otros dos"]},
  // ═══ INTERMEDIOS (8) ═══
  { id:"m1",set:"🟡 Intermedio",title:"M1. Tabla de multiplicar",description:"Pide un número. Muestra su tabla del 1 al 10.",
    solution:`[int]$num = Read-Host "Numero"\nfor ($i = 1; $i -le 10; $i++) {\n    $r = $num * $i\n    Write-Host "$num x $i = $r"\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"for hasta 10",check:c=>/\bfor\b/i.test(c)&&/10/.test(c)},{name:"*",check:c=>/\*/.test(c)},{name:"Salida formateada",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["for ($i = 1; $i -le 10; $i++)","$r = $num * $i"]},
  { id:"m2",set:"🟡 Intermedio",title:"M2. Suma de un array",description:"Pide 5 números, guárdalos en un array. Calcula la suma total con foreach.",
    solution:`$arr = @()\nfor ($i = 0; $i -lt 5; $i++) {\n    [int]$v = Read-Host "Numero $($i+1)"\n    $arr += $v\n}\n$suma = 0\nforeach ($n in $arr) {\n    $suma += $n\n}\nWrite-Host "Suma total: $suma"`,
    zones:[{name:"@()",check:c=>/@\(/.test(c)},{name:"for llenar",check:c=>/\bfor\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"+= array",check:c=>/\+=/.test(c)},{name:"foreach sumar",check:c=>/\bforeach\b/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$arr = @() vacío, luego $arr += $v","foreach ($n in $arr) { $suma += $n }"]},
  { id:"m3",set:"🟡 Intermedio",title:"M3. Cuenta atrás",description:"Pide N. Cuenta atrás hasta 0 con while. Al llegar a 0 → \"¡BOOM!\"",
    solution:`[int]$n = Read-Host "Desde"\nwhile ($n -ge 0) {\n    if ($n -eq 0) { Write-Host "BOOM!" }\n    else { Write-Host $n }\n    $n--\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"while",check:c=>/\bwhile\b/i.test(c)},{name:"--",check:c=>/--/.test(c)},{name:"if $n -eq 0",check:c=>/\bif\b/i.test(c)&&/-eq\s*0/.test(c)},{name:"BOOM",check:c=>/BOOM/i.test(c)}],
    hints:["while ($n -ge 0)","$n-- para decrementar"]},
  { id:"m4",set:"🟡 Intermedio",title:"M4. Factorial",description:"Pide un número. Calcula su factorial (5! = 120). Usa un for.",
    solution:`[int]$num = Read-Host "Numero"\n$fact = 1\nfor ($i = 1; $i -le $num; $i++) {\n    $fact = $fact * $i\n}\nWrite-Host "Factorial de $num = $fact"`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"Var = 1",check:c=>/=\s*1/.test(c)},{name:"for",check:c=>/\bfor\b/i.test(c)},{name:"* acumulado",check:c=>/\*=|\*\s*\$i/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$fact = 1 → for → $fact *= $i"]},
  { id:"m5",set:"🟡 Intermedio",title:"M5. Pares del 1 al 20",description:"Array del 1..20. Recorre con foreach. Muestra solo los pares.",
    solution:`$nums = 1..20\nforeach ($n in $nums) {\n    if ($n % 2 -eq 0) {\n        Write-Host "$n es par"\n    }\n}`,
    zones:[{name:"1..20",check:c=>/1\.\.20/.test(c)||/@\(/.test(c)},{name:"foreach",check:c=>/\bforeach\b/i.test(c)},{name:"% 2",check:c=>/%\s*2/.test(c)},{name:"if",check:c=>/\bif\b/i.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$nums = 1..20","if ($n % 2 -eq 0)"]},
  { id:"m6",set:"🟡 Intermedio",title:"M6. Triángulo de *",description:"Pide N. Dibuja triángulo:\n*\n**\n***\n****\n*****",
    solution:`[int]$n = Read-Host "Numero"\nfor ($i = 1; $i -le $n; $i++) {\n    Write-Host ("*" * $i)\n}`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"for",check:c=>/\bfor\b/i.test(c)},{name:"\"*\" * $i",check:c=>/"\*"\s*\*\s*\$i/.test(c)||/'\*'\s*\*\s*\$i/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["for $i de 1 a $n","\"*\" * $i en cada vuelta"]},
  { id:"m7",set:"🟡 Intermedio",title:"M7. Menú con switch",description:"Menú: 1.Saludar 2.Fecha 3.Aleatorio 4.Salir\nUsa switch + do-while hasta elegir 4.",
    solution:`do {\n    Write-Host "1.Saludar 2.Fecha 3.Aleatorio 4.Salir"\n    $op = Read-Host "Opcion"\n    switch ($op) {\n        "1" { $n = Read-Host "Nombre"; Write-Host "Hola $n!" }\n        "2" { Write-Host (Get-Date) }\n        "3" { Write-Host (Get-Random -Minimum 1 -Maximum 100) }\n        "4" { Write-Host "Adios!" }\n        default { Write-Host "No valida" }\n    }\n} while ($op -ne "4")`,
    zones:[{name:"do/while",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"switch",check:c=>/\bswitch\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"default",check:c=>/\bdefault\b/i.test(c)},{name:"Salir -ne 4",check:c=>/-ne/.test(c)}],
    hints:["do { switch($op) {...} } while ($op -ne '4')","default para opción inválida"]},
  { id:"m8",set:"🟡 Intermedio",title:"M8. Invertir array",description:"Pide 5 palabras → array. Muéstralas al revés con for de atrás adelante.",
    solution:`$arr = @()\nfor ($i = 0; $i -lt 5; $i++) {\n    $arr += Read-Host "Palabra $($i+1)"\n}\nWrite-Host "Invertido:"\nfor ($i = $arr.Length - 1; $i -ge 0; $i--) {\n    Write-Host $arr[$i]\n}`,
    zones:[{name:"@()",check:c=>/@\(/.test(c)},{name:"for llenar",check:c=>/\bfor\b/i.test(c)&&/Read-Host/i.test(c)},{name:"+=",check:c=>/\+=/.test(c)},{name:".Length - 1",check:c=>/\.Length/i.test(c)},{name:"-- decremento",check:c=>/--/.test(c)},{name:"Salida",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["for ($i = $arr.Length - 1; $i -ge 0; $i--)","$arr[$i] para acceder"]},
  // ═══ DIFÍCILES (7) ═══
  { id:"d1",set:"🔴 Difícil",title:"D1. FizzBuzz",description:"Del 1 al 30:\n• Múltiplo de 3 → \"Fizz\"\n• Múltiplo de 5 → \"Buzz\"\n• Ambos → \"FizzBuzz\"\n• Si no → el número",
    solution:`for ($i = 1; $i -le 30; $i++) {\n    if ($i % 3 -eq 0 -and $i % 5 -eq 0) {\n        Write-Host "FizzBuzz"\n    } elseif ($i % 3 -eq 0) {\n        Write-Host "Fizz"\n    } elseif ($i % 5 -eq 0) {\n        Write-Host "Buzz"\n    } else {\n        Write-Host $i\n    }\n}`,
    zones:[{name:"for 1..30",check:c=>/\bfor\b/i.test(c)},{name:"% 3 y % 5",check:c=>/%\s*3/.test(c)&&/%\s*5/.test(c)},{name:"-and (ambos primero)",check:c=>/-and/i.test(c)},{name:"2+ elseif",check:c=>(c.match(/elseif/gi)||[]).length>=2},{name:"FizzBuzz",check:c=>/FizzBuzz/i.test(c)}],
    hints:["¡Comprueba AMBOS primero!","% 3 -eq 0 -and % 5 -eq 0 → FizzBuzz"]},
  { id:"d2",set:"🔴 Difícil",title:"D2. Generador contraseñas",description:"Pide longitud (3-10) con do-while. Genera contraseña con array: ('a','b','c','d','$','.','&','0','8','9') eligiendo posiciones aleatorias.",
    solution:`$chars = @('a','b','c','d','$','.','&','0','8','9')\ndo {\n    [int]$lon = Read-Host "Longitud (3-10)"\n} while ($lon -lt 3 -or $lon -gt 10)\n$pass = ""\nfor ($i = 0; $i -lt $lon; $i++) {\n    $pos = Get-Random -Minimum 0 -Maximum $chars.Length\n    $pass += $chars[$pos]\n}\nWrite-Host "Contrasena: $pass"`,
    zones:[{name:"Array chars",check:c=>/@\(/.test(c)},{name:"do-while validar",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"-or rango",check:c=>/-or/i.test(c)},{name:"Get-Random",check:c=>/Get-Random/i.test(c)},{name:"for componer",check:c=>/\bfor\b/i.test(c)},{name:"+= concatenar",check:c=>/\+=/.test(c)}],
    hints:["do { Read-Host } while ($lon -lt 3 -or $lon -gt 10)","Get-Random -Minimum 0 -Maximum $chars.Length"]},
  { id:"d3",set:"🔴 Difícil",title:"D3. Contar positivos/negativos/ceros",description:"Array de 10 aleatorios entre -10 y 10. Cuenta cuántos son positivos, negativos y ceros.",
    solution:`$arr = @()\nfor ($i = 0; $i -lt 10; $i++) {\n    $arr += Get-Random -Minimum -10 -Maximum 11\n}\nWrite-Host "Array: $arr"\n$pos = 0; $neg = 0; $cero = 0\nforeach ($n in $arr) {\n    if ($n -gt 0) { $pos++ }\n    elseif ($n -lt 0) { $neg++ }\n    else { $cero++ }\n}\nWrite-Host "Positivos: $pos Negativos: $neg Ceros: $cero"`,
    zones:[{name:"@()",check:c=>/@\(/.test(c)},{name:"Get-Random -10 a 10",check:c=>/Get-Random/i.test(c)&&/-10/.test(c)},{name:"for generar",check:c=>/\bfor\b/i.test(c)},{name:"foreach contar",check:c=>/\bforeach\b/i.test(c)},{name:"3 contadores ++",check:c=>(c.match(/\+\+/g)||[]).length>=3},{name:"if/elseif/else",check:c=>/\belseif\b/i.test(c)}],
    hints:["Get-Random -Minimum -10 -Maximum 11","3 contadores: $pos, $neg, $cero"]},
  { id:"d4",set:"🔴 Difícil",title:"D4. Buscar en array",description:"Array con 5 nombres. Pide nombre a buscar. Recorre y di si está y en qué posición, o si no está.",
    solution:`$nombres = @("Ana","Luis","Marta","Pedro","Sara")\n$buscar = Read-Host "Buscar nombre"\n$enc = $false\nfor ($i = 0; $i -lt $nombres.Length; $i++) {\n    if ($nombres[$i] -eq $buscar) {\n        Write-Host "Encontrado en posicion $i"\n        $enc = $true\n    }\n}\nif (-not $enc) { Write-Host "No encontrado" }`,
    zones:[{name:"Array nombres",check:c=>/@\(/.test(c)},{name:"Read-Host buscar",check:c=>/Read-Host/i.test(c)},{name:"for con .Length",check:c=>/\.Length/i.test(c)},{name:"-eq comparar",check:c=>/-eq/i.test(c)},{name:"$encontrado bool",check:c=>/\$enc|\$encontrado|\$found/i.test(c)},{name:"-not si no está",check:c=>/-not/i.test(c)}],
    hints:["$enc = $false al inicio","if ($nombres[$i] -eq $buscar) → $enc = $true","Al final: if (-not $enc)"]},
  { id:"d5",set:"🔴 Difícil",title:"D5. Piedra Papel Tijeras",description:"Juego vs PC. Usuario: 1=Piedra 2=Papel 3=Tijeras. PC aleatorio. Dice quién gana. Repite hasta \"salir\".",
    solution:`do {\n    Write-Host "1.Piedra 2.Papel 3.Tijeras"\n    $in = Read-Host "Elige (o salir)"\n    if ($in -eq "salir") { break }\n    [int]$u = $in\n    $pc = Get-Random -Minimum 1 -Maximum 4\n    $nom = @("","Piedra","Papel","Tijeras")\n    Write-Host "Tu: $($nom[$u]) - PC: $($nom[$pc])"\n    if ($u -eq $pc) { Write-Host "Empate" }\n    elseif (($u -eq 1 -and $pc -eq 3) -or ($u -eq 2 -and $pc -eq 1) -or ($u -eq 3 -and $pc -eq 2)) { Write-Host "Ganaste!" }\n    else { Write-Host "Perdiste" }\n} while ($true)`,
    zones:[{name:"do-while infinito",check:c=>/\bdo\b/i.test(c)&&/\bwhile\b/i.test(c)},{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"Get-Random PC",check:c=>/Get-Random/i.test(c)},{name:"-and -or combinar",check:c=>/-and/i.test(c)&&/-or/i.test(c)},{name:"break salir",check:c=>/\bbreak\b/i.test(c)},{name:"if/elseif",check:c=>/\belseif\b/i.test(c)}],
    hints:["do { } while ($true) con break","Get-Random -Minimum 1 -Maximum 4","Piedra>Tijeras, Papel>Piedra, Tijeras>Papel"]},
  { id:"d6",set:"🔴 Difícil",title:"D6. Media con función",description:"Función calcularMedia que recibe array y devuelve la media. Pide 5 notas (0-10), calcula media, muestra aprobado (>=5) o suspenso.",
    solution:`function calcularMedia ($notas) {\n    $s = 0\n    foreach ($n in $notas) { $s += $n }\n    return $s / $notas.Length\n}\n$arr = @()\nfor ($i = 0; $i -lt 5; $i++) {\n    do {\n        [double]$n = Read-Host "Nota $($i+1) (0-10)"\n    } while ($n -lt 0 -or $n -gt 10)\n    $arr += $n\n}\n$media = calcularMedia $arr\nWrite-Host "Media: $media"\nif ($media -ge 5) { Write-Host "Aprobado" }\nelse { Write-Host "Suspenso" }`,
    zones:[{name:"function calcularMedia",check:c=>/function\s+calcularMedia/i.test(c)},{name:"foreach sumar",check:c=>/\bforeach\b/i.test(c)},{name:"return",check:c=>/\breturn\b/i.test(c)},{name:"for pedir notas",check:c=>/\bfor\b/i.test(c)&&/Read-Host/i.test(c)},{name:"do-while validar 0-10",check:c=>/\bdo\b/i.test(c)},{name:"Llamar función",check:c=>/calcularMedia/i.test(c)&&(c.match(/calcularMedia/gi)||[]).length>=2},{name:"-ge 5 aprobado",check:c=>/-ge\s*5/.test(c)}],
    hints:["function calcularMedia ($notas) con foreach y return","Valida cada nota con do-while","Llama: calcularMedia $arr (SIN paréntesis)"]},
  { id:"d7",set:"🔴 Difícil",title:"D7. Número primo",description:"Pide un número. Comprueba si es primo (solo divisible por 1 y sí mismo). For del 2 al num-1 probando % == 0. Usa break.",
    solution:`[int]$num = Read-Host "Numero"\n$primo = $true\nif ($num -le 1) { $primo = $false }\nfor ($i = 2; $i -lt $num; $i++) {\n    if ($num % $i -eq 0) {\n        $primo = $false\n        break\n    }\n}\nif ($primo) { Write-Host "$num es primo" }\nelse { Write-Host "$num NO es primo" }`,
    zones:[{name:"Read-Host",check:c=>/Read-Host/i.test(c)},{name:"$primo bool",check:c=>/\$primo|\$esPrimo|\$isPrime/i.test(c)},{name:"for desde 2",check:c=>/\bfor\b/i.test(c)&&/=\s*2/.test(c)},{name:"% divisibilidad",check:c=>/%/.test(c)&&/-eq\s*0/.test(c)},{name:"break",check:c=>/\bbreak\b/i.test(c)},{name:"Resultado",check:c=>/Write-(Host|Output)/i.test(c)}],
    hints:["$primo = $true al inicio","for ($i = 2; $i -lt $num; $i++)","Si $num % $i -eq 0 → $primo = $false + break"]},
];

const NOTES=[
  {t:"📌 Variables y Tipos",c:"#ff2d6a",x:`Variables: \$nombre = "Hola"  \$edad = 25\n\nTipos:\n  [int]     → Enteros\n  [string]  → Texto\n  [bool]    → \$true / \$false\n  [double]  → Decimales\n\nCasting: \$num = [int]"5"\n\$args → Argumentos del script`},
  {t:"⚖️ Comparación",c:"#00f0ff",x:`-eq Igual     -ne No igual\n-gt Mayor     -ge Mayor o igual\n-lt Menor     -le Menor o igual\n\nLógicos:\n  -and  Y     -or  O\n  -not  NO    !   NO`},
  {t:"🔀 Condicionales",c:"#b347ff",x:`if (\$x -gt 0) {\n    "Positivo"\n} elseif (\$x -lt 0) {\n    "Negativo"\n} else {\n    "Cero"\n}\n\nswitch (\$op) {\n    1 { "Uno" }\n    default { "Otro" }\n}`},
  {t:"🔁 Bucles",c:"#ffb700",x:`FOR:\nfor (\$i=0; \$i -lt 5; \$i++) {\n    Write-Host \$i\n}\n\nFOREACH:\nforeach (\$e in \$arr) {\n    Write-Host \$e\n}\n\nWHILE:\nwhile (\$x -le 10) { \$x++ }\n\nDO-WHILE:\ndo {\n    \$in = Read-Host "Dato"\n} while (\$in -ne "salir")`},
  {t:"📦 Arrays",c:"#00ff88",x:`Crear:  \$arr = @(1, 2, 3)\n        \$arr = 1..20\nAcceso: \$arr[0]  \$arr[-1]\nAñadir: \$arr += "nuevo"\nTamaño: \$arr.Length`},
  {t:"📥 E/S",c:"#ff6b35",x:`Write-Host "texto"\nWrite-Output "texto"\n\$dato = Read-Host "Mensaje"\n\n# Comentario\n<# Multilínea #>`},
  {t:"🔧 Funciones",c:"#e91e8c",x:`function suma (\$a, \$b) {\n    return \$a + \$b\n}\nsuma 3 5  ← SIN paréntesis\n\n⚠️ suma 3 5  ✅\n   suma(3,5) ❌`},
  {t:"🎲 Útiles",c:"#4ecdc4",x:`Get-Random -Minimum 1 -Maximum 11\n(Get-Date).Hour\n"*" * 5 → *****\n\$var.GetType()\n\n+ - * / %\n+= -= *= /=\n\$x++  \$x--`},
  {t:"📖 ¿Qué es PowerShell?",c:"#00bcd4",img:"/ps_tipos.png",x:`PowerShell = lenguaje de scripting + shell de comandos (Microsoft)\n\nDiferencia clave vs CMD/Bash:\n  → Trabaja con OBJETOS, no solo texto plano\n\nSirve para:\n  • Automatizar tareas del SO\n  • Administrar servidores y sistemas\n  • Gestionar archivos, procesos, servicios, redes\n  • Integrarse con Azure, Active Directory, Office 365\n\nAbrir PowerShell:\n  Win+R → powershell\n  Windows Terminal (recomendado)\n  VS Code → terminal integrada\n\nVersión: \$PSVersionTable\n  PowerShell 5.1 viene con Windows\n  PowerShell 7+ es multiplataforma`},
  {t:"📖 Cmdlets (Verbo-Sustantivo)",c:"#009688",x:`Los comandos se llaman Cmdlets (command-lets)\nSiempre: Verbo-Sustantivo\n\nGet-Date          # Fecha y hora actual\nGet-Process       # Procesos en ejecución\nGet-Service       # Servicios del sistema\nGet-ChildItem     # Archivos y carpetas (ls/dir)\nClear-Host        # Limpia pantalla (cls)\n\nRegla de oro:\n  Obtener  → Get-\n  Detener  → Stop-\n  Iniciar  → Start-\n  Configurar → Set-\n  Crear    → New-\n  Eliminar → Remove-`},
  {t:"📖 Strings (métodos)",c:"#8bc34a",x:`\$texto = "hola mundo"\n\n\$texto.Length          # 10 (caracteres)\n\$texto.ToUpper()       # "HOLA MUNDO"\n\$texto.ToLower()       # "hola mundo"\n\$texto.Replace("hola","adiós")  # "adiós mundo"\n\$texto.Contains("mundo")       # True\n\$texto.StartsWith("hola")      # True\n\$texto.Split(" ")    # @("hola", "mundo")\n\$texto.Trim()          # quita espacios inicio/fin\n\$texto.Substring(0,4) # "hola"\n\nComillas dobles " " → expande variables\nComillas simples ' ' → literal\n  "Tengo \$edad años"  → Tengo 25 años\n  'Tengo \$edad años'  → Tengo \$edad años`},
  {t:"📖 Números y Bool",c:"#ff9800",x:`Int:     \$entero = 42\nDouble:  \$decimal = 3.14\nDecimal: [decimal]\$precio = 9.99\n\nConversión:\n  [int]"25"     → 25\n  [double]"25"  → 25.0\n  "10" + "5"    → "105" (texto!)\n  10 + 5        → 15\n  [int]"10" + 5 → 15\n\nBool:\n  \$activo = \$true\n  \$inactivo = \$false\n  \$esMayor = (25 -ge 18)  → \$true\n  -not \$activo → \$false\n  !\$inactivo   → \$true`},
  {t:"📖 Hashtable (diccionario)",c:"#e91e63",x:`\$persona = @{\n    Nombre = "Ana"\n    Edad   = 30\n    Ciudad = "Madrid"\n}\n\nAcceso:\n  \$persona["Nombre"]  → "Ana"\n  \$persona.Nombre     → "Ana"\n\nAñadir:\n  \$persona["Email"] = "ana@mail.com"\n  \$persona.Telefono = "600123456"\n\nEliminar: \$persona.Remove("Telefono")\n\nVer todo:\n  \$persona.Keys    → Nombre, Edad, Ciudad\n  \$persona.Values  → Ana, 30, Madrid\n\nComprobar:\n  \$persona.ContainsKey("Edad")  → True`},
  {t:"📖 Tipos y Scope",c:"#795548",img:"/ps_tipos.png",x:`Forzar tipo:\n  [int]\$edad = 25\n  [string]\$nombre = "Carlos"\n  [decimal]\$precio = 9.99\n  [bool]\$activo = \$true\n\n  [int]\$x = "hola"  → ERROR\n  [int]\$x = "25"    → OK (convierte)\n\nÁmbito (Scope):\n  \$x = 10             # Local (solo este bloque)\n  \$global:cnt = 0     # Global (toda la sesión)\n  \$env:USERNAME       # Variable de entorno del SO\n  \$script:version     # Solo dentro del .ps1\n\nVariables automáticas:\n  \$true  \$false  \$null\n  \$_     → elemento actual en pipeline\n  \$Error → lista de errores recientes\n  \$args  → argumentos del script`},
  {t:"📖 Interpolación en texto",c:"#607d8b",x:`\$nombre = "Carlos"\n\$edad = 25\n\nBásico:\n  "Hola \$nombre"  → Hola Carlos\n\nExpresiones con \$( ):\n  "Doble: \$(\$edad * 2)"  → Doble: 50\n  "Nacimiento: \$(2024 - \$edad)"\n\nFormato:\n  "{0:N2}" -f 9.99      → 9,99\n  "{0:C}" -f 1500       → 1.500,00 €\n\nConcatenar con +:\n  "Hola " + \$nombre + ", tienes " + \$edad\n\nHere-String (multilínea):\n  @"\n  Nombre: \$nombre\n  Edad: \$edad\n  "@`},
  {t:"📖 Operadores aritméticos",c:"#3f51b5",img:"/ps_operadores.png",x:`\$a = 10; \$b = 3\n\n\$a + \$b   → 13 (suma)\n\$a - \$b   → 7  (resta)\n\$a * \$b   → 30 (multiplicación)\n\$a / \$b   → 3.33 (división)\n\$a % \$b   → 1  (módulo/resto)\n\nIncremento/Decremento:\n  \$a++     → 11\n  \$a--     → 10\n  \$a += 5  → 15\n  \$a -= 3  → 12\n  \$a *= 2  → 24\n  \$a /= 4  → 6\n\nPotencia (PS 7+):\n  [Math]::Pow(2, 8) → 256\n\nMódulo: si resultado es 0 → divisible\n  10 % 2 = 0 → par`},
  {t:"📖 Operadores texto/patrón",c:"#9c27b0",x:`-like (comodín con * y ?):\n  "PowerShell" -like "Power*"   → True\n  "PowerShell" -like "*Shell"   → True\n  "PowerShell" -notlike "*Java*" → True\n\n-match (regex):\n  "Carlos123" -match "\\d+"     → True\n  "hola@mail.com" -match "@"   → True\n  \$Matches[0] → lo encontrado\n\n-in / -notin:\n  "pera" -in @("manzana","pera") → True\n  "kiwi" -notin @("manzana")     → True\n\n-contains:\n  @("manzana","pera") -contains "pera" → True\n\n-replace:\n  "Hola Mundo" -replace "Mundo","PS"\n  → "Hola PS"`},
  {t:"📖 Switch avanzado",c:"#00695c",img:"/ps_condicionales.png",x:`switch básico:\n  switch (\$dia) {\n    "Lunes"  { "Inicio semana" }\n    "Viernes" { "¡Por fin!" }\n    default  { "Día cualquiera" }\n  }\n\nMúltiples coincidencias (sin break):\n  switch (\$n) {\n    { \$_ -gt 0 }     { "Positivo" }\n    { \$_ % 2 -eq 0 } { "Par" }\n    { \$_ -gt 5 }     { "Mayor que 5" }\n  }\n\nCon -wildcard:\n  switch -wildcard (\$archivo) {\n    "*.csv"  { "Es CSV" }\n    "*.xlsx" { "Es Excel" }\n  }\n\nCon -regex:\n  switch -regex (\$email) {\n    "@gmail\\.com\$"   { "Gmail" }\n    "@empresa\\.com\$" { "Empresa" }\n  }\n\nTernario (PS 7+):\n  \$estado = (\$edad -ge 18) ? "Mayor" : "Menor"`},
  {t:"📖 Bucles detallado",c:"#f44336",img:"/ps_bucles.png",x:`FOR (sabes cuántas veces):\n  for (\$i=1; \$i -le 5; \$i++) { \$i }\n  Hacia atrás: for (\$i=10; \$i -ge 1; \$i--)\n  De 2 en 2: for (\$i=0; \$i -le 20; \$i+=2)\n\nFOREACH (recorrer listas):\n  foreach (\$p in Get-Process) {\n    "\$(\$p.Name) — \$(\$p.CPU)"\n  }\n  Pipeline: \$arr | ForEach-Object { \$_ * 2 }\n\nDO-WHILE (mínimo 1 vez, repite si true):\n  do {\n    \$pw = Read-Host "Contraseña"\n    \$cnt++\n  } while (\$pw -ne "1234" -and \$cnt -lt 3)\n\nDO-UNTIL (mínimo 1 vez, repite hasta true):\n  do {\n    \$n = Read-Host "Adivina (1-10)"\n  } until (\$n -eq 7)\n\nBREAK → sale del bucle\nCONTINUE → salta a siguiente vuelta\n\n1..10 → array @(1,2,...,10)`},
  {t:"📖 Get-Help y comandos",c:"#546e7a",x:`Get-Help Get-Process          # Ayuda básica\nGet-Help Get-Process -Detailed # Detallada\nGet-Help Get-Process -Examples # Solo ejemplos\nGet-Help Get-Process -Online   # En navegador\n\nGet-Command *process*   # Busca comandos\nGet-Member              # Métodos y propiedades\n\nEjemplo:\n  Get-Process | Get-Member\n  → muestra todos los métodos de un proceso\n\nAntes de buscar en Google:\n  → prueba Get-Help`},
];

function hl(c){if(!c)return"";let h=c.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
h=h.replace(/(#[^\n]*)/g,'<span style="color:#6a9955">$1</span>');
h=h.replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#ce9178">$1</span>');
h=h.replace(/('(?:[^'\\]|\\.)*')/g,'<span style="color:#ce9178">$1</span>');
["if","else","elseif","for","foreach","while","do","switch","default","function","return","param","break","continue","in"].forEach(k=>{h=h.replace(new RegExp(`\\b(${k})\\b`,"gi"),'<span style="color:#ff79c6;font-weight:bold">$1</span>');});
["-eq","-ne","-gt","-ge","-lt","-le","-and","-or","-not"].forEach(o=>{h=h.replace(new RegExp(`(${o.replace("-","\\-")})\\b`,"gi"),'<span style="color:#ff79c6;font-weight:bold">$1</span>');});
["Write-Output","Write-Host","Read-Host","Get-Random","Get-Date","Get-Content","New-Item","Remove-Item"].forEach(d=>{h=h.replace(new RegExp(`\\b(${d})\\b`,"gi"),'<span style="color:#00f0ff">$1</span>');});
h=h.replace(/(\$[\w:]+)/g,'<span style="color:#bd93f9">$1</span>');
h=h.replace(/(\[(?:int|string|double|bool|decimal|array)\])/gi,'<span style="color:#50fa7b">$1</span>');
return h;}

export default function App(){
  const[idx,setIdx]=useState(0);
  const[code,setCode]=useState("");
  const[res,setRes]=useState(null);
  const[sol,setSol]=useState(false);
  const[notes,setNotes]=useState(false);
  const[yay,setYay]=useState(false);
  const[expanded,setExpanded]=useState(null);
  const ta=useRef(null),pr=useRef(null);
  const ex=EXERCISES[idx];
  useEffect(()=>{setCode("");setRes(null);setSol(false);setYay(false);setExpanded(null);},[idx]);
  // Auto-resize textarea
  useEffect(()=>{if(ta.current){ta.current.style.height="auto";ta.current.style.height=Math.max(220,ta.current.scrollHeight)+"px";}},[code]);
  const braceBalance=(s)=>{const o=(s.match(/\{/g)||[]).length;const c=(s.match(/\}/g)||[]).length;return{open:o,close:c,balanced:o===c,missing:o-c};};
  const chk=()=>{const zr=ex.zones.map(z=>({...z,ok:z.check(code)}));const bb=braceBalance(code);const braceZone={name:"Llaves { }",ok:bb.balanced,check:()=>bb.balanced};if(bb.open>0||bb.close>0)zr.push(braceZone);const ok=zr.every(z=>z.ok)&&code.trim().length>12;setRes({zones:zr,ok,bb});setSol(true);setExpanded(null);if(ok){setYay(true);setTimeout(()=>setYay(false),4500);}};
  const nxt=()=>{const f=ex.zones.find(z=>!z.check(code));if(!f){const bb=braceBalance(code);if(bb.missing>0){setCode(p=>p.trim()+"\n"+("}\n".repeat(bb.missing)).trim());setRes(r=>r?{...r,ok:false}:r);}return;}const sl=ex.solution.split("\n");let ln="";for(const l of sl){if(f.check(l)){ln=l.trim();break;}}setCode(p=>(p.trim()?p.trim()+"\n":"")+(ln||`# TODO: ${f.name}`));const zr=ex.zones.map(z=>({...z,ok:z.check(code+(ln?"\n"+ln:""))}));setRes({zones:zr,ok:false});setSol(false);setExpanded(f.name);};
  const handleTab=(e)=>{if(e.key==="Tab"){e.preventDefault();const t=e.target;const start=t.selectionStart;const end=t.selectionEnd;const val=code;setCode(val.substring(0,start)+"    "+val.substring(end));setTimeout(()=>{t.selectionStart=t.selectionEnd=start+4;},0);}};
  const sy=()=>{if(pr.current&&ta.current)pr.current.scrollTop=ta.current.scrollTop;};
  const sets=[...new Set(EXERCISES.map(e=>e.set))];
  return(<><style>{`*{box-sizing:border-box}.hl-c{color:#6a9955}.btn{border:none;padding:9px 20px;border-radius:7px;font-weight:700;cursor:pointer;font-size:12px;letter-spacing:.5px;transition:all .2s}.btn:hover{filter:brightness(1.3);transform:translateY(-1px)}.bc{background:rgba(0,240,255,.1);color:#00f0ff;border:2px solid #00f0ff;box-shadow:0 0 10px rgba(0,240,255,.2)}.by{background:rgba(255,183,0,.07);color:#ffb700;border:2px solid rgba(255,183,0,.35)}.bp{background:rgba(255,45,106,.08);color:#ff2d6a;border:2px solid rgba(255,45,106,.3)}.bg{background:rgba(255,255,255,.03);color:#777;border:1px solid rgba(255,255,255,.1)}.bg:disabled{opacity:.25;cursor:default}@keyframes si{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes bo{0%{transform:scale(.3);opacity:0}50%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}@keyframes gl{0%,100%{text-shadow:0 0 20px #ff2d6a,0 0 40px #00f0ff}50%{text-shadow:0 0 40px #ff2d6a,0 0 80px #00f0ff,0 0 120px #b347ff}}select option{background:#1a0a2e;color:#e0e0e0}`}</style>
  <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0a1a,#1a0a2e 30%,#0f1923 70%,#0a0a1a)",color:"#e0e0e0",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative"}}>
  <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(0,240,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.03) 1px,transparent 1px)",backgroundSize:"50px 50px",pointerEvents:"none"}}/>
  <div style={{position:"fixed",top:0,left:"15%",width:"70%",height:2,background:"linear-gradient(90deg,transparent,#ff2d6a,#00f0ff,#b347ff,transparent)",boxShadow:"0 0 20px #ff2d6a,0 0 40px #00f0ff",zIndex:10}}/>
  {/* HEADER */}
  <div style={{position:"relative",zIndex:5,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(0,240,255,.1)",flexWrap:"wrap",gap:8}}>
    <div><h1 style={{margin:0,fontSize:19,fontWeight:900,background:"linear-gradient(90deg,#ff2d6a,#00f0ff,#b347ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:2}}>⚡ POWERSHELL TRAINER</h1><div style={{fontSize:10,color:"#444",letterSpacing:1}}>Cuatrovientos · ISO · {EXERCISES.length} ejercicios</div></div>
    <select value={idx} onChange={e=>setIdx(+e.target.value)} style={{background:"rgba(0,240,255,.05)",border:"1px solid rgba(0,240,255,.2)",color:"#00f0ff",padding:"7px 12px",borderRadius:6,fontSize:11,outline:"none",cursor:"pointer",maxWidth:360}}>
      {sets.map(s=><optgroup key={s} label={s}>{EXERCISES.map((e,i)=>e.set===s?<option key={i} value={i}>{e.title}</option>:null)}</optgroup>)}
    </select>
  </div>
  {/* MAIN */}
  <div style={{position:"relative",zIndex:5,display:"flex",minHeight:"calc(100vh - 64px)"}}>
    <div style={{flex:1,padding:"14px 18px",display:"flex",flexDirection:"column",minWidth:0,overflow:"auto"}}>
      {/* DESC */}
      <div style={{background:"rgba(179,71,255,.05)",border:"1px solid rgba(179,71,255,.15)",borderRadius:9,padding:"12px 14px",marginBottom:12}}>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}><span style={{color:"#b347ff",fontSize:11,fontWeight:700}}>{ex.set}</span><span style={{color:"#333"}}>·</span><span style={{color:"#ff2d6a",fontSize:14,fontWeight:700}}>{ex.title}</span></div>
        <div style={{fontSize:12.5,lineHeight:1.75,color:"#a8a8b0",whiteSpace:"pre-wrap"}}>{ex.description}</div>
      </div>
      {/* EDITOR */}
      <div style={{flex:1,position:"relative",background:"rgba(6,6,18,.95)",border:"1px solid rgba(0,240,255,.1)",borderRadius:9,overflow:"hidden",minHeight:260}}>
        <div style={{padding:"5px 12px",background:"rgba(0,240,255,.03)",borderBottom:"1px solid rgba(0,240,255,.06)",display:"flex",justifyContent:"space-between"}}><span style={{color:"#00f0ff",fontSize:10,fontWeight:700,letterSpacing:1}}>📝 EDITOR</span><span style={{color:"#333",fontSize:9}}>{code.split("\n").length} líneas</span></div>
        <div style={{position:"relative",minHeight:220}}>
          <pre ref={pr} style={{position:"absolute",inset:0,margin:0,padding:"12px 12px 12px 42px",fontFamily:"'Fira Code','Cascadia Code','Consolas',monospace",fontSize:12.5,lineHeight:1.6,overflow:"auto",whiteSpace:"pre-wrap",wordWrap:"break-word",pointerEvents:"none",color:"transparent",display:"none"}} dangerouslySetInnerHTML={{__html:hl(code)+"\n"}}/>
          <textarea ref={ta} value={code} onChange={e=>{setCode(e.target.value);setRes(null);setSol(false);}} onKeyDown={handleTab} onPaste={e=>{e.stopPropagation();}} onScroll={sy} spellCheck={false} placeholder={"# Escribe tu script aquí...\n# Ej: [int]$num = Read-Host \"Numero\""} style={{position:"relative",width:"100%",minHeight:220,background:"transparent",border:"none",outline:"none",color:"#e0e0e0",caretColor:"#00f0ff",fontFamily:"'Fira Code','Cascadia Code','Consolas',monospace",fontSize:12.5,lineHeight:1.6,padding:"12px 12px 12px 42px",resize:"none",overflow:"hidden",whiteSpace:"pre-wrap",wordWrap:"break-word"}}/>
          <div style={{position:"absolute",top:0,left:0,width:34,padding:"12px 4px",textAlign:"right",fontFamily:"monospace",fontSize:10,lineHeight:1.6,color:"#2a2a3a",borderRight:"1px solid rgba(0,240,255,.04)",userSelect:"none",pointerEvents:"none"}}>{code.split("\n").map((_,i)=><div key={i}>{i+1}</div>)}</div>
        </div>
      </div>
      {/* BTNS */}
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap",alignItems:"center"}}>
        <button className="btn bc" onClick={chk}>✅ CHECK</button>
        <button className="btn by" onClick={nxt}>💡 SIGUIENTE PASO</button>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <button className="btn bg" disabled={idx===0} onClick={()=>setIdx(Math.max(0,idx-1))}>◀</button>
          <button className="btn bg" disabled={idx===EXERCISES.length-1} onClick={()=>setIdx(Math.min(EXERCISES.length-1,idx+1))}>▶</button>
        </div>
      </div>
      <div style={{marginTop:8,padding:"8px 12px",background:"rgba(255,183,0,.03)",borderRadius:7,border:"1px solid rgba(255,183,0,.1)"}}>
        <span style={{color:"#ffb700",fontSize:10,fontWeight:700}}>💡 </span>{ex.hints.map((h,i)=><span key={i} style={{color:"#7a6a40",fontSize:10.5}}>{i>0?" · ":""}{h}</span>)}
      </div>
    </div>
    {/* RIGHT */}
    <div style={{width:380,borderLeft:"1px solid rgba(0,240,255,.06)",padding:"14px 14px",overflowY:"auto",background:"rgba(0,0,0,.12)"}}>
      {res?<>
        <div style={{marginBottom:12}}><div style={{color:"#b347ff",fontSize:11,fontWeight:700,marginBottom:6,letterSpacing:1}}>🎯 ZONAS</div>
        {res.zones.map((z,i)=>{const help=getZoneHelp(z.name,ex);const isExp=expanded===z.name;return<div key={i} style={{marginBottom:3}}><div onClick={()=>!z.ok&&setExpanded(isExp?null:z.name)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 7px",borderRadius:isExp?"5px 5px 0 0":"5px",background:z.ok?"rgba(0,255,136,.04)":"rgba(255,45,106,.04)",border:`1px solid ${z.ok?"rgba(0,255,136,.15)":"rgba(255,45,106,.15)"}`,cursor:!z.ok?"pointer":"default"}}><span style={{fontSize:13}}>{z.ok?"✅":"❌"}</span><span style={{color:z.ok?"#00ff88":"#ff2d6a",fontSize:11,fontWeight:600,flex:1}}>{z.name}</span>{!z.ok&&<span style={{color:"#666",fontSize:9}}>{isExp?"▲":"▼"}</span>}</div>{isExp&&<div style={{background:"rgba(179,71,255,.06)",border:"1px solid rgba(179,71,255,.15)",borderTop:"none",borderRadius:"0 0 5px 5px",padding:"8px 10px"}}><div style={{color:"#b8b8c0",fontSize:11,lineHeight:1.6,marginBottom:6,whiteSpace:"pre-wrap"}}>{help.desc}</div>{help.ej&&<pre style={{margin:0,padding:"6px 8px",background:"rgba(6,6,18,.6)",borderRadius:4,fontFamily:"'Fira Code',monospace",fontSize:10.5,lineHeight:1.5,color:"#ffb700",whiteSpace:"pre-wrap"}}>{help.ej}</pre>}</div>}</div>;})}
        <div style={{marginTop:7,padding:"7px 9px",borderRadius:5,background:res.ok?"rgba(0,255,136,.07)":"rgba(255,183,0,.05)",border:`1px solid ${res.ok?"rgba(0,255,136,.2)":"rgba(255,183,0,.15)"}`,color:res.ok?"#00ff88":"#ffb700",fontSize:12,fontWeight:700,textAlign:"center"}}>{res.ok?"🎉 ¡PERFECTO!":"⚠️ Revisa las zonas en rojo"}</div></div>
        {/* USER */}
        <div style={{marginBottom:12}}><div style={{color:"#ff2d6a",fontSize:11,fontWeight:700,marginBottom:5}}>📋 TU CÓDIGO</div>
        <div style={{background:"rgba(6,6,18,.8)",borderRadius:7,border:"1px solid rgba(255,45,106,.1)",padding:"5px 0",maxHeight:160,overflowY:"auto"}}>
          {code.split("\n").map((l,i)=><div key={i} style={{padding:"1px 6px",fontFamily:"'Fira Code',monospace",fontSize:11,lineHeight:1.55}}><span dangerouslySetInnerHTML={{__html:hl(l)}}/></div>)}
        </div></div>
        {/* SOL */}
        {sol&&<div><div style={{color:"#00ff88",fontSize:11,fontWeight:700,marginBottom:5}}>✨ SOLUCIÓN</div>
        <div style={{background:"rgba(6,6,18,.8)",borderRadius:7,border:"1px solid rgba(0,255,136,.1)",padding:"5px 0",maxHeight:280,overflowY:"auto"}}>
          {ex.solution.split("\n").map((l,i)=>{const fx=res.zones.some(z=>!z.ok&&z.check(l));return<div key={i} style={{padding:"1px 6px",borderLeft:fx?"3px solid #00ff88":"3px solid transparent",background:fx?"rgba(0,255,136,.06)":"transparent",fontFamily:"'Fira Code',monospace",fontSize:11,lineHeight:1.55}}><span dangerouslySetInnerHTML={{__html:hl(l)}}/>{fx&&<span style={{color:"#00ff88",fontSize:9,marginLeft:6}}>← corregido</span>}</div>;})}
        </div></div>}
      </>:<div style={{color:"#333",fontSize:12,textAlign:"center",marginTop:50,lineHeight:2.2}}><div style={{fontSize:32,marginBottom:8}}>⚡</div>Escribe tu script<br/>y pulsa <span style={{color:"#00f0ff",fontWeight:700}}>CHECK</span><br/><br/><span style={{color:"#ffb700"}}>SIGUIENTE PASO</span><br/>te ayuda</div>}
    </div>
  </div>
  {/* NOTES BTN */}
  <button onClick={()=>setNotes(!notes)} style={{position:"fixed",bottom:16,right:16,zIndex:100,width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#ff2d6a,#b347ff)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",boxShadow:"0 0 18px rgba(255,45,106,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>📖</button>
  {/* NOTES */}
  {notes&&<div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(460px,90vw)",background:"linear-gradient(180deg,#0a0a1a,#1a0a2e)",borderLeft:"2px solid rgba(255,45,106,.2)",boxShadow:"-6px 0 25px rgba(0,0,0,.5)",zIndex:99,overflowY:"auto",padding:"16px 18px",animation:"si .3s ease-out"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{margin:0,fontSize:16,fontWeight:800,background:"linear-gradient(90deg,#ff2d6a,#00f0ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>📖 Apuntes</h2><button className="btn bp" onClick={()=>setNotes(false)} style={{padding:"4px 10px",fontSize:11}}>✕</button></div>
    {NOTES.map((n,i)=><div key={i} style={{marginBottom:12,borderRadius:8,border:`1px solid ${n.c}22`,background:`${n.c}05`,overflow:"hidden"}}><div style={{padding:"7px 12px",background:`${n.c}10`,borderBottom:`1px solid ${n.c}15`,color:n.c,fontSize:13,fontWeight:700}}>{n.t}</div>{n.img&&<img src={n.img} alt={n.t} style={{width:"100%",maxHeight:220,objectFit:"contain",background:"#111",borderBottom:`1px solid ${n.c}15`}}/>}<pre style={{margin:0,padding:"8px 12px",fontFamily:"'Fira Code','Cascadia Code',monospace",fontSize:11.5,lineHeight:1.65,color:"#a8a8b0",whiteSpace:"pre-wrap"}}>{n.x}</pre></div>)}
  </div>}
  {/* PERFECT */}
  {yay&&<div onClick={()=>setYay(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fi .3s"}}>
    <div style={{animation:"bo .6s ease-out",textAlign:"center"}}>
      <div style={{width:140,height:140,borderRadius:"50%",border:"3px solid #ff2d6a",boxShadow:"0 0 35px rgba(255,45,106,.5)",margin:"0 auto 14px",background:"linear-gradient(135deg,#ff2d6a20,#b347ff20)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:64}}>🎉</div>
      <div style={{fontSize:28,fontWeight:900,background:"linear-gradient(90deg,#ff2d6a,#00f0ff,#b347ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"gl 2s ease-in-out infinite"}}>¡¡PERFECTO!!</div>
      <div style={{color:"#444",fontSize:10,marginTop:8}}>(click para cerrar)</div>
    </div>
  </div>}
  </div></>);
}