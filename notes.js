angular.module('notesApp', [])
    .controller('NotesController', function () {
        var vm = this;
        vm.notes = getNotesFromLocalStorage(); //усі замітки з LocalStorage
        vm.newNote = { title: '', text: '', color: "red", selectedCategories: {}, selectedLabels: {} }; //шаблон нової замітки
        vm.editMode = false; //індикатор того, редагується замітка або створюється нова
        vm.editIndex = null; //індекс замітки, що редагується
        vm.colors = ['red', 'blue', 'yellow', 'green']; //набір кольорів
        vm.baseCategories = { //початковий набір категорій
            'Терміново': {
                'терміново і важливо': null,
                'Терміново, але не важливо': null
            },
            'Не терміново': {
                'Не терміново, але важливо': null,
                'Не терміново та не важливо': null
            }
        };
        //початковий набір ярликів
        vm.baseLabels = ['https://cdn-icons-png.flaticon.com/128/12149/12149587.png', 'https://cdn-icons-png.flaticon.com/128/12149/12149615.png', 'https://cdn-icons-png.flaticon.com/128/12149/12149618.png', 'https://cdn-icons-png.flaticon.com/128/12149/12149626.png'];  // Тут додати свої ярлики
        vm.userLabels = getLabelsFromLocalStorage(); //збережені в сховищі користувацькі ярлики
        vm.newCategory = '';
        vm.newLabel = '';

        //поєднання базових категорій з користувацькими категоріями зі сховища
        vm.categories = getCategoriesFromLocalStorage().length === 0 ? vm.baseCategories : getCategoriesFromLocalStorage();
        //поєднання базових ярликів з користувачькими ярликами за сховища
        vm.labels = Array.from(new Set(vm.baseLabels.concat(vm.userLabels)));

        //створення чи редагування замітки, викликається при надсиланні форми, присвоює та надсилає оновлені дані
        vm.addOrUpdateNote = function () {
            //замітка повинна мати заголовок, текст та колір
            if (vm.newNote.title && vm.newNote.text && vm.newNote.color) {
                //з обєкту з категоріями дістаємо їх текстові назви
                vm.newNote.categories = Object.keys(vm.newNote.selectedCategories);
                //якщо редагується вже існуюча замітка
                if (vm.editMode) {
                    //із списку всіх заміток обирається необхідна (за індексом)
                    //параметри старої замітки замінюються на нові
                    vm.notes[vm.editIndex].title = vm.newNote.title;
                    vm.notes[vm.editIndex].text = vm.newNote.text;
                    vm.notes[vm.editIndex].color = vm.newNote.color;
                    vm.notes[vm.editIndex].selectedCategories = angular.copy(vm.newNote.selectedCategories);
                    vm.notes[vm.editIndex].categories = angular.copy(vm.newNote.categories);
                    vm.notes[vm.editIndex].selectedLabels = angular.copy(vm.newNote.selectedLabels);
                    vm.editMode = false; //вимикається режим редагування

                    //якщо замітка не редагується а створюється, то вона додається у масив всіх заміток
                } else {
                    vm.notes.push(angular.copy(vm.newNote));
                }

                //очищується шаблон нової замітки
                vm.newNote = {title: '', text: '', color: "red", selectedCategories: {}, selectedLabels: {}};
                saveNotesToLocalStorage(vm.notes); //оновлений набір заміток зберігається в сховище
            }
        };

        //створення нової категорії
        vm.addNewCategory = function () {
            //якщо введена назва для нової категорії, а також такої категорії ще не існує
            if (vm.newCategory && vm.recursiveCheck(vm.categories, vm.newCategory)) {
                //стоврюється нова категорія з пустим значенням (тобто не має підкатегорій)
                vm.categories[vm.newCategory] = null;

                //оновлені категорії зберігаються у сховищі
                saveCategoriesToLocalStorage(vm.categories);
            }
        };

        //створення нової підкатегорії
        vm.addNewSubcategory = function (category) {
            //спливаюче вікно для вводу назви нової підкатегорії
            var newSubcategory = prompt("Введіть назву нової підкатегорії для " + category + ":", "");

            //якщо назва не пуста, а також такої категорії ще не існує
            if (newSubcategory !== null && newSubcategory.trim() !== "" && vm.recursiveCheck(vm.categories, newSubcategory)) {
                //категорія додається до обєкту категорій
                vm.recursiveAdd(vm.categories, category, newSubcategory);
                //оновлені категорії зберігаються у сховищі
                saveCategoriesToLocalStorage(vm.categories);
            }
        };

        //додавання підкатегорії до багаторівневого обєкту категорій в правильному місці
        //передається обєкт всіх категорій, назва батьківської категорії до якої необхідно додати нову, та назва нової підкатегорії
        vm.recursiveAdd = function (categories, category, newCategory) {
            //якщо список категорій не пустий, а також містить шукаєму батьківську категорію
            if(categories!==null && categories.hasOwnProperty(category)){
                //якщо в батьківської категорії ще немає підкатегорій, то створюється пустий обєкт
                if(categories[category]==null) categories[category]={};
                //створюється підкатегорія, і має пусте значення (тобто не має підкатегорій)
                categories[category][newCategory]=null;
                return;
            }
            //якщо батьківська категорія не була знайдена в списку категорій
            else{
                //для кожної підкатегорії рекурсивно викликається функція пошуку в ній потрібної категорії
                angular.forEach(categories, function (subcategories, key) {
                    if(subcategories!==null) vm.recursiveAdd(subcategories, category, newCategory);
                });
            }
            return;
        };

        //перевірка чи існує в обєкті з категоріями задана назва категорії
        vm.recursiveCheck = function (categories, category) {
            //якщо список категорій не пустий, та містить передану назву категорії
            //повертається false, тобто "не можна створити категорію з такою назвою"
            if(categories!==null && categories.hasOwnProperty(category)){
                return false;
            }
            //якщо назва категорії не була знайдена
            else{
                //перебираються всі підкатегорії, та вже серед них шукається задана назва
                angular.forEach(categories, function (subcategories, key) {
                    if(subcategories!==null) return vm.recursiveAdd(subcategories, category);
                });
            }

            //якщо задана назва нової категорії не була знайдена, повертається true, тобто "можна створити таку категорію"
            return true;
        };

        //створення нового ярлику
        vm.addNewLabel = function () {
            //якщо введене користувачем посилання на ярлик не пусте, та ще не міститься в списку користувацьких ярликів
            if (vm.newLabel && !vm.userLabels.includes(vm.newLabel)) {
                vm.userLabels.push(vm.newLabel); //додати в список нове посилання на ярлик
                vm.newLabel = ''; //очистити поле для вводу посилання
                vm.labels = Array.from(new Set(vm.baseLabels.concat(vm.userLabels))); //оновити масив усіх ярликів поєднавши базові та користувацькі

                //збереження оовлених ярликів до сховища
                saveLabelsToLocalStorage(vm.userLabels);
            }
        };

        //збереження категорій до сховища
        function saveCategoriesToLocalStorage(categories) {
            localStorage.setItem('userCategories', JSON.stringify(categories));
        }

        //збереження ярликів до сховища
        function saveLabelsToLocalStorage(labels) {
            localStorage.setItem('userLabels', JSON.stringify(labels));
        }

        //отримання катеорій зі сховища
        function getCategoriesFromLocalStorage() {
            var storedCategories = localStorage.getItem('userCategories');
            //якщо в сховищі є користувацькі категорії, то повернути їх, інакше повернути пустий масив
            return storedCategories ? JSON.parse(storedCategories) : [];
        }

        //отримати ярлики зі сховища
        function getLabelsFromLocalStorage() {
            var storedLabels = localStorage.getItem('userLabels');
            //якщо в сховищі є користувацькі ярлики, то повернути їх, інакше повернути пустий масив
            return storedLabels ? JSON.parse(storedLabels) : [];
        }

        //редагування замітки, ф-я для перенесення даних замітки в форму
        vm.editNote = function (note) {
            //перенесення параметрів існуючої замітки до шаблону нової замітки, а також у форму для редагування замітки
            vm.newNote.title = note.title;
            vm.newNote.text = note.text;
            vm.newNote.color = note.color;
            vm.newNote.selectedCategories = angular.copy(note.selectedCategories);
            vm.newNote.categories = angular.copy(note.categories);
            vm.newNote.selectedLabels = angular.copy(note.selectedLabels);
            vm.editMode = true; //включення режиму редагування
            vm.editIndex = vm.notes.indexOf(note); //отримання індекса замітки, що редагується

            //при редагуванні перейти на початок сторінки для зручності
            window.scrollTo(0, 0);
        };


        //видалити замітку
        vm.removeNote = function (note) {
            //отримати індекс замітки яку необхідно видалити
            var index = vm.notes.indexOf(note);
            //якщо замітка з таким індексом існує
            if (index !== -1) {
                vm.notes.splice(index, 1); //видалити з масиву заміток необхідну
                saveNotesToLocalStorage(vm.notes); //зберегти оновлений масив до сховища
            }
        };

        //збереження заміток до сховища
        function saveNotesToLocalStorage(notes) {
            localStorage.setItem('notes', JSON.stringify(notes));
        }

        //отримання заміток зі сховища
        function getNotesFromLocalStorage() {
            var storedNotes = localStorage.getItem('notes');
            //якщо список заміток не пустий, то повернути його, інакше повернути пустий масив
            return storedNotes ? JSON.parse(storedNotes) : [];
        }
    });
