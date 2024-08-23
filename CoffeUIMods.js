const extensionMySettingsDefault = {
    _autoAllOpenBuildings: false,
    _autoCalculateProfits: false,
}

const hudMenuItemLabelMyAssets = 'My Assets';
const arrowClassOpen = 'sc-gsGlKL eAaTji';
const arrowClassClose = 'sc-gsGlKL rviqt';

const setUpDivSearch = 'div[label="Set Up"].sc-kIRMQU.biVvEc';

let AllMyCrews = 0;
let OpenBuildings = 0;
let ScientistBonus = false;
let outputLength = 0;
    
let SetUpElement = null;

let PreviousSelection = null;
let CurrentSelection = null;
let PreviousSr = null;
let CurrentSr = null;
let PreviousPrimary = null;
let CurrentPrimary = null;


if (!localStorage.getItem('MySettings')) {
    localStorage.setItem('MySettings', JSON.stringify(extensionMySettingsDefault));
}

const extensionMySettings = JSON.parse(localStorage.getItem('MySettings'));

// ================================== Settings ==================================
function updateMySettings() {
    let updatePanel = document.getElementById('e115-config-panel-wrapper')

    injectMyConfigOptionCheckbox('All-OpenBuildings', 'Auto Open All Buildings');
    injectMyConfigOptionCheckbox('Calculate-Profits', 'Calculate All Profits');
    updatePanel.querySelector('input[name="All-OpenBuildings"]').checked = extensionMySettings._autoAllOpenBuildings;
    updatePanel.querySelector('input[name="Calculate-Profits"]').checked = extensionMySettings._autoCalculateProfits;
}

function setExtensionMySetting(settingKey, settingValue) {
    extensionMySettings[settingKey] = settingValue;
    localStorage.setItem('MySettings', JSON.stringify(extensionMySettings));
}

function injectMyConfigOptionCheckbox(optionName, optionDescription, isSecondaryOption = false) {
    const elConfigOptions = document.getElementById('e115-config-options');
    const elConfigOptionLabel = createEl('label');
    elConfigOptionLabel.innerHTML = /*html*/ `
        <input type="checkbox" name="${optionName}" onclick="onClickMyConfigOption(this)"><span>${optionDescription}</span>
    `;
    if (isSecondaryOption) {
        elConfigOptionLabel.classList.add('e115-config-option-secondary')
    }
    elConfigOptions.append(elConfigOptionLabel);
}

function onClickMyConfigOption(el) {
    switch (el.name) {
        case 'All-OpenBuildings':
            setExtensionMySetting('_autoAllOpenBuildings', el.checked);
            break;
        case 'Calculate-Profits':
            setExtensionMySetting('_autoCalculateProfits', el.checked);
            break;            
    }
}

// ========================================== UI Functions ==========================================
function ShowOff(selectiontxt,inputdata,outputdata,srs) {

    // Check if the "My-Calculations" div already exists
    let calculationsWrapper = SetUpElement.querySelector('div.My-Calculations');

    if (!calculationsWrapper) {
        // Create the main wrapper div if it doesn't exist
        calculationsWrapper = document.createElement('div');
        calculationsWrapper.className = 'My-Calculations';

        // Apply Flexbox styles to the wrapper div
        calculationsWrapper.style.display = 'flex';
        calculationsWrapper.style.justifyContent = 'space-between'; // Spread items evenly across the row
        calculationsWrapper.style.alignItems = 'flex-start'; // Align items at the top

        // Create the left, middle, and right div elements
        const inputDiv = document.createElement('div');
        inputDiv.className = 'myInput';
        inputDiv.style.flex = '1'; // Allow this div to expand as much as needed
        inputDiv.style.marginRight = '10px'; // Optional spacing between columns
        inputDiv.style.padding = '2px 0'; // Add padding with 2px top and bottom

        const outputDiv = document.createElement('div');
        outputDiv.className = 'myOutput';
        outputDiv.style.flex = '1'; // Allow this div to expand as much as needed
        outputDiv.style.marginRight = '10px'; // Optional spacing between columns
        outputDiv.style.padding = '2px 0'; // Add padding with 2px top and bottom

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'mySummary';
        summaryDiv.style.width = '300px'; // Set fixed width for summaryDiv
        summaryDiv.style.textAlign = 'right'; // Align text to the right
        summaryDiv.style.flex = 'none'; // Prevent this div from expanding
        summaryDiv.style.padding = '2px 10px 2px 0'; // Add padding: 2px top/bottom, 10px right, 0 left

        // Append the left, middle, and right divs to the wrapper div
        calculationsWrapper.appendChild(inputDiv);
        calculationsWrapper.appendChild(outputDiv);
        calculationsWrapper.appendChild(summaryDiv);

        // Append the wrapper div to the target element
        SetUpElement.appendChild(calculationsWrapper);
    }

    // Get references to the input, output, and summary divs
    const inputDiv = calculationsWrapper.querySelector('div.myInput');
    const outputDiv = calculationsWrapper.querySelector('div.myOutput');
    const summaryDiv = calculationsWrapper.querySelector('div.mySummary');

    // Clear previous content
    inputDiv.innerHTML = '';
    outputDiv.innerHTML = '';
    summaryDiv.innerHTML = '';

    // Calculate total minutes
    const durationElement = document.querySelector('div.sc-hmTbGb.HwdBV');
    let totalMinutes = 0;
    
    if (durationElement) {
        // Get the text content, e.g., "2d 14h 15m"
        const durationText = durationElement.textContent.trim();

        // Initialize variables for days, hours, and minutes
        let days = 0;
        let hours = 0;
        let minutes = 0;

        // Use regular expressions to extract the days, hours, and minutes
        const daysMatch = durationText.match(/(\d+)d/);  // Find the "d" part
        const hoursMatch = durationText.match(/(\d+)h/);  // Find the "h" part
        const minutesMatch = durationText.match(/(\d+)m/); // Find the "m" part

        // Convert extracted values to integers and calculate total minutes
        if (daysMatch) days = parseInt(daysMatch[1], 10);
        if (hoursMatch) hours = parseInt(hoursMatch[1], 10);
        if (minutesMatch) minutes = parseInt(minutesMatch[1], 10);

        // Calculate total minutes: 1 day = 1440 minutes, 1 hour = 60 minutes
        totalMinutes = (days * 1440) + (hours * 60) + minutes;

        //console.log(`Total minutes: ${totalMinutes}`);
    } else {
        console.error('Element not found');
    }

    // Calculate costs and prepare content
    let inputContent = '';
    let outputContent = '';
    let color = null;

    // Process Input
    let totalInputCost = 0;
    inputdata.forEach(({ ItemName, ItemAmount, ItemPercentage }) => {
        const price = prices[ItemName] || 0;
        const sr = srs || 1; // Default to 1 if SR is not available
        let reduction = 1;

        if (ItemPercentage !== 100) reduction = (100-ItemPercentage)/100;

        const All_tones = ItemAmount * sr * reduction;
        const formattedTones = formatTones(All_tones);
        const cost = price * All_tones;
        color = getColor(cost);
        inputContent += `<div>${ItemName} (${formattedTones}): <label style="color: ${color};"> ${cost.toFixed(2)}</label> SWAY</div>`;
        totalInputCost += cost;
    });

    // Add total input cost to inputContent
    color = getColor(totalInputCost);
    inputContent += `<div style="font-weight: bold; font-size: 16px;">Total Input Cost: <label style="color: ${color};"> ${totalInputCost.toFixed(2)}</label> SWAY</div>`;

    // Process Output
    let totalOutputCost = 0;
    outputdata.forEach(({ ItemName, ItemAmount, ItemPercentage }) => {
        const price = prices[ItemName] || 0;
        const sr = srs || 1; // Default to 1 if SR is not available
        let reduction = 1;

        if (ItemPercentage !== 100) reduction = (100-ItemPercentage)/100;
        const All_tones = ItemAmount * sr * reduction;
        const formattedTones = formatTones(All_tones);
        const cost = price * All_tones;
        color = getColor(cost);
        outputContent += `<div>${ItemName} (${formattedTones}): <label style="color: ${color};"> ${cost.toFixed(2)}</label> SWAY</div>`;
        totalOutputCost += cost;
    });

    // Add total output cost to outputContent
    color = getColor(totalOutputCost);
    outputContent += `<div style="font-weight: bold; font-size: 16px;">Total Output Cost: <label style="color: ${color};"> ${totalOutputCost.toFixed(2)}</label> SWAY</div>`;

    // Create or update input, output, and summary container divs
    createOrUpdateContainer(inputDiv, 'new-input-costs', inputContent);
    createOrUpdateContainer(outputDiv, 'new-output-costs', outputContent);

    let summaryContent = `<div>Total Duration: ${totalMinutes} minutes</div>`;
    let Profit = totalOutputCost - totalInputCost;
    let ProfitPerMinute = Profit / totalMinutes;
    color = getColor(Profit);
    summaryContent += `<div style="font-weight: bold; font-size: 18px; color:${color};">Total Profits: ${Profit.toFixed(2)} SWAY</div>`;
    color = getColor(ProfitPerMinute);
    summaryContent += `<div style="font-weight: bold; font-size: 16px; color:${color};">Profit/Minute: ${ProfitPerMinute.toFixed(2)} SWAY</div>`;

    if (outputLength > 1){
    if (ScientistBonus) summaryContent += `<div style="font-weight: bold; font-size: 16px; color: green;">Scientist bonus ! </div>`;
    else summaryContent += `<div style="font-weight: bold; font-size: 16px; color: red;">NO Scientist bonus ! </div>`;    
    }
    
    createOrUpdateContainer(summaryDiv, 'new-summary', summaryContent);
}

// ============================================================== Helper functions ==============================================================
function extractSRRounds(element){
    // Check if the target element exists
    if (element) {
        // Find all <b> elements inside the target element
        const bElements = element.querySelectorAll('b');

        // Check if there are at least 3 <b> elements
        if (bElements.length >= 3) {
            // Get the third <b> element (index 2)
            const thirdBElement = bElements[2];
            
            // Get the text content of the third <b> element and trim any whitespace
            const textContent = thirdBElement.textContent.trim();
            
            // Convert the text content to an integer
            const numberValue = parseFloat(textContent.replace(/,/g, ''));
            
            // Check if the conversion was successful and return the result
            if (!isNaN(numberValue)) {
                return numberValue;
            } else {
                console.error('Third <b> element does not contain a valid number');
                return null;
            }
        } else {
            console.error('Less than 3 <b> elements found');
            return null;
        }
    } else {
        console.error('Target element not found');
        return null;
    }
}

function extractTooltipData(element) {
  // Initialize an array to hold the formatted tooltip data
    const tooltipDataArray = [];

    // Select all elements with the `data-tooltip-content` attribute within the given element
    const tooltipElements = element.querySelectorAll('[data-tooltip-content]');

    // Iterate over each tooltip element
    tooltipElements.forEach((tooltipElement) => {
        // Get the tooltip value (item name) from the 'data-tooltip-content' attribute
        const itemName = tooltipElement.getAttribute('data-tooltip-content');

        // Select the 4th child of the current element and then get the text content of its first child div
        const fourthChild = tooltipElement.children[3]; // Select the 4th child (index 3)
        const firstChildDiv = fourthChild ? fourthChild.querySelector('div') : null; // Select the first div child of the 4th child
        const amountText = firstChildDiv ? firstChildDiv.textContent.trim() : null; // Get and trim text content

        // Convert the text content to a number and remove commas
        const amount = amountText ? parseInt(amountText.replace(/,/g, ''), 10) : null;

        // Find the label element that is a sibling below the tooltipElement
        let itemPercentage = 100; // Default percentage
        let label = null;

        // Navigate to the parent container of the tooltipElement
        const parentContainer = tooltipElement.parentElement;
        if (parentContainer) {
            // Find the next sibling of the parent container that is a label
            const siblingElements = Array.from(parentContainer.children);
            const tooltipIndex = siblingElements.indexOf(tooltipElement);

            if (tooltipIndex !== -1) {
                // Iterate over siblings below the tooltipElement
                for (let i = tooltipIndex + 1; i < siblingElements.length; i++) {
                    if (siblingElements[i].tagName === 'LABEL') {
                        label = siblingElements[i];
                        break;
                    }
                }
            }
        }

        if (label) {
            // Check if the label is primary and adjust percentage accordingly
            if (label.textContent.trim().toLowerCase() !== 'primary') {
                // Extract percentage from label if it's not "primary"
                const labelText = label.textContent.trim();
                const percentageMatch = labelText.match(/(-?\d+(\.\d+)?)%/);
                if (percentageMatch) {
                    itemPercentage = parseFloat(percentageMatch[1].replace('-', ''));
                } else {
                    itemPercentage = 100; // Default to 100 if no percentage found
                }

                if (itemPercentage != 100 && itemPercentage < 75) ScientistBonus = true;
                else ScientistBonus = false;
            }
        }

        // Create an object for each item with ItemName, ItemAmount, and ItemPercentage
        if (itemName && !isNaN(amount)) {
            const itemData = {
                ItemName: itemName,
                ItemAmount: amount,
                ItemPercentage: itemPercentage
            };
            tooltipDataArray.push(itemData);
        } else {
            console.warn(`Item: ${itemName}, Amount: Not found or invalid`);
        }
    });

    // Return the array of item data objects
    return tooltipDataArray;
}

function findPrimaryLocationIndex(obj) {
    return obj.findIndex(({ ItemPercentage }) => ItemPercentage === 100);
}

// Function to format tones
function formatTones(value) {
    if (value >= 1000) {
        if (value >= 1_000_000) {
            return `${(value / 1_000_000).toFixed(2)} kt/unit`;
        } else {
            return `${(value / 1_000).toFixed(2)} t/unit`;
        }
    }
    return `${value.toFixed(2)} kg/unit`;
}
// Function to create or update a container div
function createOrUpdateContainer(parentElement, id, content) {
    let containerDiv = parentElement.querySelector(`#${id}`);
    if (!containerDiv) {
        containerDiv = document.createElement('div');
        containerDiv.id = id;
        containerDiv.style.marginTop = '10px';
        parentElement.appendChild(containerDiv);
    }
    containerDiv.innerHTML = content;
}

function getColor(number) {
    if (number < 0) {
        return 'red';
    } else if (number === 0) {
        return 'yellow';
    } else {
        return 'green';
    }
}

// ============================================================= Main Functions =============================================================
function openMyAssets(){
    // is auto Open All Buildings enabled?
    if (extensionMySettings._autoAllOpenBuildings == true){
        
        if (isElHudMenuItemSelectedByLabel(hudMenuItemLabelMyAssets) && AllMyCrews == 0 && OpenBuildings == 0 ) {

            const hudMenuPanel = document.getElementById('hudMenuPanel');
            
            // The My Assets  hud menu item is already selected
            // Find the last div containing the text "Across All My Crews"
            const divs = hudMenuPanel.querySelectorAll('div');
            let lastMatchingDiv = null;
            for (let div of divs) {
                if (div.textContent.includes("Across All My Crews")) {
                    lastMatchingDiv = div;
                }
            }

            // Click the last matching div if found
            if (lastMatchingDiv && AllMyCrews == 0) {
                if (AllMyCrews == 0) {
                    lastMatchingDiv.click();
                    AllMyCrews = 1;
                }
            } else {}
                
            // Find all spans inside hudMenuPanel
            const spans2 = hudMenuPanel.querySelectorAll('span');
            let targetSpan = null;
        
            // Locate the span with the text "Buildings"
            for (let span2 of spans2) {
                if (span2.textContent.trim() === 'Buildings') {
                    targetSpan = span2;
                    break;
                }
            }

            if (targetSpan) {
                // go back to 1 parent 
                let parentDivs = [];
                let parent = targetSpan.parentElement;
                let grandparent = parent.parentElement;
                let grandgrandparent = grandparent.parentElement;
                let firstgrandChild = grandgrandparent.children[0];

                // Check arrow class
                if (firstgrandChild.className != arrowClassOpen && firstgrandChild.className != arrowClassClose){
                    console.error("Arrow classes changed, needs update");
                    return;
                }
                
                if (firstgrandChild.className != arrowClassClose && OpenBuildings == 0){
                    OpenBuildings = 1;
                }
                else {
                    //Buildings closed 
                     if (OpenBuildings == 0){
                        targetSpan.click();
                        OpenBuildings = 1;
                    }
                }
                
            }

        }
        else {
            AllMyCrews = 0;
            OpenBuildings = 0;
        }
    }
}

function AutoProfit() {

    // is auto Profit Calculation enabled?
    if (extensionMySettings._autoCalculateProfits == true){
        
        // first check for production headers (Most will have production)
        const elExtractionHeader = document.querySelector('div[src*="/static/media/Production"]');
        if (!elExtractionHeader) {
            // Extract Resource window NOT open
            return;
        }
        
        // We will keep watching for windows
        SetUpElement = document.querySelector(setUpDivSearch);
        if (!SetUpElement) {
            console.error('Element not found, but Production window is open. Update class definitions');
        }
        else {

            // ================================== Find process selected label ==================================

            // Find all <label> elements inside the found element
            const labels = SetUpElement.querySelectorAll('label');
            if (labels.length > 0) {
                labels.forEach((label, index) => {
                    //console.log(`Label ${index + 1}: ${label.textContent.trim()}`);
            });
            } else {
                console.log('No labels found within the element.');
            }

            // Current selection of Set Up
            if (labels.length < 1) return false;
            
            CurrentSelection = labels[1].textContent.trim();
            if (CurrentSelection === "Select a Process...") return;

            // ================================== Extract elements ==================================
            // Select child elements for input and output
            const firstChild = SetUpElement.children[0];
            if (!firstChild) return;

            const secondChildOfFirstChild = firstChild.children[1];
            if (!secondChildOfFirstChild) return;

            const thirdChildOfSecondChild = secondChildOfFirstChild.children[2];
            if (!thirdChildOfSecondChild) return;

            const inputElement = thirdChildOfSecondChild.children[1];
            const outputElement = thirdChildOfSecondChild.children[2];

            // Extract data
            const Input = this.extractTooltipData(inputElement);
            const Output = this.extractTooltipData(outputElement);
            outputLength = Output.length;
            const CurrentSr = this.extractSRRounds(thirdChildOfSecondChild.children[0]);

            CurrentPrimary = findPrimaryLocationIndex(Output);

            // Checking if selection been changed, after that checking all output data checksums.
            // Checking if Data is different, ignore SR or crew bonus as it is all reflected inside that data
            // Concentrate more on output as it has different percentages and different selector for main
            // Output is important for storage selector as well
            if (typeof PreviousSelection !== 'undefined' && CurrentSelection !== PreviousSelection) {
                PreviousSelection = CurrentSelection;
                ShowOff(CurrentSelection,Input,Output,CurrentSr);
            } else if (CurrentSr !== PreviousSr) {
                PreviousSr = CurrentSr;
                ShowOff(CurrentSelection,Input,Output,CurrentSr);
            } else if (CurrentPrimary !== PreviousPrimary){
                PreviousPrimary = CurrentPrimary;
                ShowOff(CurrentSelection,Input,Output,CurrentSr);
            }
        }
    }
    
}

updateMySettings();
// Run MyChanges function every 1 second
// Run both functions every 1 second
setInterval(() => {
    AutoProfit();
    openMyAssets();
}, 1000);


async function testing() {
    console.log(testing);

}
