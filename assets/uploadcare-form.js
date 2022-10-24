window.document.addEventListener("DOMContentLoaded", () => {
    uploadcare.Widget('[name="file"]', {
        "publicKey": "7a20a5ab5a227c76f892",
        "tabs": "file"
    })
});
(function () {
    const productID = document.getElementById('product-data').innerText
    const sessionStorageKey = "uploadcare_" + productID;
    const authButtons = Array.from(document.getElementsByClassName('authenticate-btn'))
    const overlay = document.querySelector('.popup-overlay')
    const formDialog = document.querySelector('.popup-container')
    const tabs = document.querySelector('.tabs')
    const uploaderContainer = document.querySelector(".uploadcare-attributes")
    const uploadBlocks = document.querySelectorAll('.tab-section__content ')
    const uploadSubmit = document.getElementById('upload_submit')
    const widget = uploadcare.Widget('[role=uploadcare-uploader]');
    let currentTab
    let formIsValid = false
    let store = {}
    let currentCollection = document.querySelector("input[name='types']:checked").id
    let currentImageType = document.querySelector('.tab-active').children[0].id

    if (sessionStorage.getItem(sessionStorageKey) !== null) {
        console.log(sessionStorage.getItem(sessionStorageKey))
    }

    authButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault()
            overlay.classList.remove('hidden')
            overlay.classList.add('open')
            setTimeout(() => {
                formDialog.classList.remove('transparent')
            }, 200)
            document.querySelector('.tabs').style.height = document.querySelector('.tab-active').clientHeight + "px";
            document.body.classList.add('popup-page')
        });
    })

    function switchTabs(tab) {
        let activeTab = document.querySelector('.tab-active')
        activeTab.classList.toggle('tab-active')
        currentTab = document.getElementById(`tab-${tab}`)
        currentTab.classList.toggle('tab-active')
        let activeTip = document.querySelector('.tip-active')
        activeTip.classList.toggle('tip-active')
        let currentTip = document.getElementById(`tip-${tab}`)
        currentTip.classList.toggle('tip-active')
        document.querySelector('.tabs').style.height = document.querySelector('.tab-active').clientHeight + "px";
        document.getElementById('collection-title').innerText = tab.replace('-', ' ')
        document.querySelectorAll('.uploaded').forEach(block => {
            block.classList.remove('uploaded')
            block.querySelector('.tab-section__counter').innerHTML = ""
        })
        resetUploaderData()

    }

    document.querySelectorAll("input[name='types']").forEach((input) => {
        if (input.checked) {
            currentTab = document.getElementById(`tab-${input.id}`)
            switchTabs(input.id)
            currentCollection = input.id;
        }
        input.addEventListener('change', (event) => {
            event.stopPropagation()
            currentCollection = event.target.id;
            formIsValid = false
            authButtons.forEach((btn) => {
                btn.innerText = "Upload photos"
            })
            uploaderContainer.innerHTML = ''
            switchTabs(currentCollection)
        });
    });

    function closeDialog() {
        formDialog.classList.add('transparent')
        overlay.classList.add('hiding')
        setTimeout(() => {
            document.body.classList.remove('popup-page')
            overlay.classList.remove('hiding', 'open')
            overlay.classList.add('hidden')
        }, 350)
    }


    uploadBlocks.forEach(block => {
        block.addEventListener('click', () => {
            document.querySelector('.uploadcare--widget__button').click()
            currentImageType = block.id
        })
    })

    let updatedFiles = []

    widget.onChange(() => {
        document.getElementById(currentImageType).querySelector('.loader-line').classList.add('visible')
        formDialog.classList.add('disable')
    });

    function setCurrentUuids() {
        if (sessionStorage.getItem(sessionStorageKey) !== null) {

            let storeData = JSON.parse(sessionStorage.getItem(sessionStorageKey))
            store = {...storeData.store}
        }
    }

    function setCartProperties() {
        if (formIsValid) {
            //Set the collection Property separately in line items
            let collectionProperty = document.createElement("input")
            collectionProperty.name = 'properties[_Category]'
            collectionProperty.id = "property-" + currentCollection
            collectionProperty.value = currentCollection
            uploaderContainer.appendChild(collectionProperty)

            for (let key in store) {
                if (store[key].length) {
                    store[key].forEach((uuid) => {
                        let url = "https://ucarecdn.com/" + uuid + "/"
                        let property = document.createElement("input")
                        let propertyName = key.replace(currentCollection, '') // property name without collection instead key
                        property.name = "properties[" + propertyName + "]"
                        property.id = uuid
                        property.value = url
                        uploaderContainer.appendChild(property)
                    })
                }
            }

            uploadSubmit.classList.remove('disabled')
            authButtons.forEach((btn) => {
                btn.innerText = "Uploaded"
            })
        } else {
            uploadSubmit.classList.add('disabled')
            authButtons.forEach((btn) => {
                btn.innerText = "Upload photos"
            })
        }
    }

    function validateForm() {
        formIsValid = true
        let container = document.getElementById(currentTab.id)
        let collection = Array.from(container.querySelectorAll(".item-required"))
        collection.forEach(el => {
            if (!el.classList.contains('uploaded')) {
                formIsValid = false
            }
        })
        setCartProperties()
    }

    function updateRequireFields() {
        for (let key in store) {
            let counterID = "counter-tab-" + key
            let counterValue = store[key].length
            if (counterValue) {
                document.getElementById(counterID).innerText = counterValue
                document.getElementById(key).classList.add('uploaded')
            } else {
                document.getElementById(counterID).innerText = ""
                document.getElementById(key).classList.remove('uploaded')
            }
        }
    }

    function resetUploaderData() {
        formIsValid = false
        store = {}
        sessionStorage.removeItem(`uploadcare_${productID}`)
        uploadSubmit.classList.add('disabled')
    }

    widget.onUploadComplete(async (info) => {
        let group = await uploadcare.loadFileGroup(info.uuid)

        await setCurrentUuids()

        await group.files().forEach(file => {
            file.done(fileInfo => {
                updatedFiles.push(fileInfo.uuid)
            });
        });

        document.getElementById(currentImageType).querySelector('.loader-line').classList.remove('visible')
        document.querySelector('.popup-container').classList.remove('disable')

        if (updatedFiles.length) {
            if (typeof store[currentImageType] !== "undefined") {
                store[currentImageType] = [...store[currentImageType], ...updatedFiles]
            } else {
                let item = {
                    [currentImageType]: [...updatedFiles]
                }
                Object.assign(store, item)
            }
        }

        updateRequireFields()

        validateForm()

        let uploadcareData = {
            form: sessionStorageKey,
            store: Object.assign(store),
            collection: currentCollection
        }

        sessionStorage.setItem(sessionStorageKey, JSON.stringify(uploadcareData))

        updatedFiles = []

    })

    window.addEventListener('resize', () => {
        tabs.style.height = document.querySelector('.tab-active').clientHeight + "px";
    })

    document.getElementById('cart___submit').addEventListener('click', () => {
        console.log(formIsValid, uploaderContainer)
        if (formIsValid && uploaderContainer.firstChild) {
            resetUploaderData()
        }
    })

    document.getElementById('upload_submit').addEventListener('click', () => {
        closeDialog()
    });

    document.querySelector('.popup-btn__close').addEventListener('click', () => {
        closeDialog()
    })
})();
