// Version 0.3
// For Influence Tools 1.0.84_0
// TODO:
    // 1.a One function to read settings be it mine or influence
    // 1.b Change scroll bar location to fixed instead of class asap
//DONE    // 2. UI changes: Lot notice control
//DONE    // 3. UI changes: Lot numbers in my assets 
//DONE    // 4. UI changes: scrollbar memory
    

const extensionMySettingsDefault = {
    _autoAllOpenBuildings: true,
    _autoCalculateProfits: true,
    _autoHideAllNotices: true,
    _autoRememberMyAssetsScrollBar : true,
    _autoChangeAllUseLot : true
}

const hudMenuItemLabelMyAssets = 'My Assets';
const arrowClassOpen = 'sc-csDkEv eIqyZC';
const arrowClassClose = 'sc-csDkEv etVnJB';

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
let isMenuInjected = false;

let account_removedNoticesArray = [];
let account_removedNoticesBoolean = false;
let account_currentCrew = 0;
let account_previousCrew = 0;
let account_LoadStatus = 0;

// ================================== Settings ==================================
if (!localStorage.getItem('MySettings')) {
    localStorage.setItem('MySettings', JSON.stringify(extensionMySettingsDefault));
}

const extensionMySettings = JSON.parse(localStorage.getItem('MySettings'));


function updateMySettings() {

    if (!isMenuInjected){

        let updatePanel = document.getElementById('e115-config-panel-wrapper')
        if (updatePanel != null){
            injectMyConfigOptionCheckbox('All-OpenBuildings', '"My Assets"> Open ALL Buildings');
            injectMyConfigOptionCheckbox('Remember-ScrollBar', '"My Assets"> Scrollbar memory');
            injectMyConfigOptionCheckbox('UseLot-numbered', '"My Assets"> Lot Fields');
            injectMyConfigOptionCheckbox('Calculate-Profits', 'Manufacture> Show Profits');
            injectMyConfigOptionCheckbox('Remove-Notices', 'Lot Expiration> Hide forever');
            updatePanel.querySelector('input[name="All-OpenBuildings"]').checked = extensionMySettings._autoAllOpenBuildings;
            updatePanel.querySelector('input[name="Calculate-Profits"]').checked = extensionMySettings._autoCalculateProfits;
            updatePanel.querySelector('input[name="Remove-Notices"]').checked = extensionMySettings._autoHideAllNotices; 
            updatePanel.querySelector('input[name="Remember-ScrollBar"]').checked = extensionMySettings._autoRememberMyAssetsScrollBar; 
            updatePanel.querySelector('input[name="UseLot-numbered"]').checked = extensionMySettings._autoChangeAllUseLot;   
            isMenuInjected = true;
            account_removedNoticesArray = extensionMySettings.RemovedNotices;
        }
    }
}
function setExtensionMySetting(settingKey, settingValue) {
    extensionMySettings[settingKey] = settingValue;
    localStorage.setItem('MySettings', JSON.stringify(extensionMySettings));
}
function GetInfluenceSettings(element) {
    try {
        const influenceSettings = JSON.parse(localStorage.getItem('influence'));
        
        if (!influenceSettings || !influenceSettings.state) {
            return -1; // Return default value if structure is invalid
        }

        switch (element) {
            case 'selectedCrewId':
                return influenceSettings.state.selectedCrewId;
            case 'launcherPage':
                return influenceSettings.state.launcherPage;
            case 'openHudMenu':
                return influenceSettings.state.openHudMenu;                
            default:
                return 0; 
        }
    }
    catch (error) {
        console.error('Error parsing localStorage data:', error);
        return -1; 
    }
}

function injectMyConfigOptionCheckbox(optionName, optionDescription, isSecondaryOption = false) {
    const elConfigOptions = document.getElementById('e115-config-options');
    if (elConfigOptions != null){
        const elConfigOptionLabel = createEl('label');
        elConfigOptionLabel.innerHTML = /*html*/ `
            <input type="checkbox" name="${optionName}" onclick="onClickMyConfigOption(this)"><span>${optionDescription}</span>
        `;
        if (isSecondaryOption) {
            elConfigOptionLabel.classList.add('e115-config-option-secondary')
        }
        elConfigOptions.append(elConfigOptionLabel);        
    }
}
function onClickMyConfigOption(el) {
    switch (el.name) {
        case 'All-OpenBuildings':
            setExtensionMySetting('_autoAllOpenBuildings', el.checked);
            break;
        case 'Calculate-Profits':
            setExtensionMySetting('_autoCalculateProfits', el.checked);
            break;
        case 'Remove-Notices':
            setExtensionMySetting('_autoHideAllNotices', el.checked);
            break;   
        case 'Remember-ScrollBar':
            setExtensionMySetting('_autoRememberMyAssetsScrollBar', el.checked);
            break;   
        case 'UseLot-numbered':
            setExtensionMySetting('_autoChangeAllUseLot', el.checked);
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
    
    // XPath search
    const xpath = "//div[span[contains(text(),'SRs')]]";
    const durationElement = document.evaluate("//div[span[contains(text(),'SRs')]]", SetUpElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.parentNode?.firstElementChild;
    
    //const durationElement = document.querySelector('div.sc-hmTbGb.HwdBV');
    //replaced class search
    
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
        const price = cachedData.prices[ItemName] || 0;
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
        const price = cachedData.prices[ItemName] || 0;
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
// Auto open all assets
function openMyAssets(){
    
    // is auto Open All Buildings enabled?
    if (extensionMySettings._autoAllOpenBuildings == true){

        if (isElHudMenuItemSelectedByLabel(hudMenuItemLabelMyAssets) && AllMyCrews == 0 && OpenBuildings == 0 ) {

            const hudMenuPanel = document.getElementById('hudMenuPanel');
            //document.getElementById('MySexy-structures-table-wrapper').scrollTop = this.scrollBarPosition
            
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
function ScrollBarMain(){
    let menu = GetInfluenceSettings('openHudMenu');
    if (menu == "MY_ASSETS") {
    
            if (ScrollBarStatus == 0){ // Initialize scroll bar 
              
                // element not definied, we find it 
                if (ScrollBarElement == null) {
                    const targetDiv = document.querySelector('div.sc-evzXkX.geZvpt');
                    if (targetDiv) {
                        console.log(targetDiv.scrollTop);
                        ScrollBarElement = targetDiv;
                        ScrollBarStatus = 1;

                    } else {
                        console.log('No div found, check if class definition changed?');
                    }
                }

            } else if (ScrollBarStatus == 1) {
                if (scrollBarRestore && scrollBarPosition > 0) {
                    const maxScrollPosition = ScrollBarElement.scrollHeight - ScrollBarElement.clientHeight;
                    
                    if (maxScrollPosition >= (scrollBarSize - 200) && maxScrollPosition <= scrollBarSize){
                        ScrollBarElement.scrollTop = scrollBarPosition;
                        scrollBarRestore = false;
                        //console.log(`Current Scrollbar size: ${maxScrollPosition} Scrollbar Size: ${scrollBarSize}`);
                    }
                }
                else {
                    scrollBarPosition = ScrollBarElement.scrollTop;                    
                    scrollBarSize = ScrollBarElement.scrollHeight - ScrollBarElement.clientHeight;
                    //console.log(`Scrollbar Position ${scrollBarPosition} Scrollbar Size: ${scrollBarSize}`);
                }
            } 
        } 
        else {
            // scroll bar element null
            ScrollBarElement = null;
            ScrollBarStatus = 0;
            scrollBarRestore = true;
        }
}
function ReplaceAllUseLot(){
    const hudMenuPanel = document.getElementById('hudMenuPanel');
    // Loop through each div and check for "Use Lot"
    const divs = hudMenuPanel.querySelectorAll('div');
    // Loop through each div and check for "Use Lot"
    divs.forEach(div => {
        const label = div.querySelector('label');
    
        if (label && label.textContent.trim() === "Use Lot") {
            // Get the first child of the div
            const firstChild = div.children[1].children[0];
        
            if (firstChild && firstChild.tagName === 'SPAN') {
                // Replace "Use Lot" with "Use " + the content of the first span
                label.textContent = `Use ${firstChild.textContent}`;
            }
        }
    });
}
// Auto calculate All profits
function AutoProfit() {

    // is auto Profit Calculation enabled?
    if (extensionMySettings._autoCalculateProfits == true){
        
        // first check for production headers (Most will have production)
        const elExtractionHeader = document.querySelector('div[src*="/static/media/Production"]');
        if (!elExtractionHeader) {
            // Extract Resource window NOT open
            return;
        }

        // Select the parent of the parent
        SetUpElement = elExtractionHeader.parentElement.parentElement;
        
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

// ============================================================= Work on progress =============================================================
function changesOfNoticesMain(){
    // call notice function to update all crap 
    account_currentCrew = GetInfluenceSettings('selectedCrewId');
    // crew change scan
    if (account_currentCrew != 0 && account_currentCrew != account_previousCrew){
        if (account_removedNoticesBoolean == false){
            changesOfNotices(account_currentCrew)
            account_removedNoticesBoolean = true;
            account_previousCrew = account_currentCrew;
        }
        else { //activate boolean on false on crew change 
            account_removedNoticesBoolean = false;
        }

    }
}
function changesOfNotices(crewId) {
    const coloredDivs = document.querySelectorAll('div[color="255,152,79"], div[color="255,86,77"]');

    // Function to check if a div contains the specified text in any child element
    function containsTextInChildren(div, text) {
        return Array.from(div.querySelectorAll('*')).some(child => 
            child.textContent.toLowerCase().includes(text.toLowerCase())
        );
    }

    const matchingDivs = Array.from(coloredDivs).filter(div => 
        containsTextInChildren(div, "expir") && containsTextInChildren(div, "Use lot")
    );

    matchingDivs.forEach(div => {
        const lotNumberElement = Array.from(div.children).find(child => child.textContent.includes("Lot #"));

        if (lotNumberElement) {
            const lotId = lotNumberElement.textContent.match(/Lot #(\d+,?\d*,?\d*)/)[1];

            // Get the current date in seconds
            const currentDateInSeconds = Math.floor(Date.now() / 1000);

            // Create the new element to be added to the RemovedNotices array
            const newRemovedNotice = {
                CrewId: crewId,
                LotId: lotId,
                DateRemoved: currentDateInSeconds
            };

            // Check if the notice with this LotId and CrewId is already present in the array
            const existingNotice = account_removedNoticesArray.find(notice => notice.LotId === lotId && notice.CrewId === crewId);

            if (existingNotice) {
                // If the notice exists in the array, find and click the button
                clickNoticeButton(div);
            } else {
                // Check if there's already a span with the text '-X-' inside the div
                const existingSign = Array.from(div.children).find(child => child.tagName === 'SPAN' && child.textContent.includes('-X-'));

                if (!existingSign) {
                    // Add a sign after "Use Lot" if it doesn't exist
                    const sign = document.createElement('span');
                    sign.textContent = ' -X- ';
                    div.appendChild(sign);

                    // Assign a function to the sign element
                    sign.addEventListener('click', function() {
                        // Call RemoveElement with the LotId, CrewId, and the current div as parameters
                        RemoveElement(lotId, crewId, div);
                    });

                    // Save the updated array to settings
                    setExtensionMySetting('RemovedNotices', account_removedNoticesArray);
                }
            }
        } else {
            console.error('Lot # not found in this div');
        }
    });
}
// Your function that handles the removal of an element by LotId
function RemoveElement(LotId, crewId, noticeElement) {
    // Get current time in seconds
    const currentDateInSeconds = Math.floor(Date.now() / 1000);

    // Create the new element to be added to the RemovedNotices array
    const newRemovedNotice = {
        CrewId: crewId,
        LotId: LotId,
        DateRemoved: currentDateInSeconds
    };

    // Add the new element to the RemovedNotices array if not already present
    const existingNotice = account_removedNoticesArray.find(notice => notice.LotId === LotId && notice.CrewId === crewId);
    
    if (!existingNotice) {
        account_removedNoticesArray.push(newRemovedNotice);
    }

    // Save RemovedNotices to extension settings
    setExtensionMySetting('RemovedNotices', account_removedNoticesArray);

    // Simulate clicking the button instead of removing the div
    clickNoticeButton(noticeElement);
}
// Function to find and click the button inside the notice element
function clickNoticeButton(noticeElement) {
    // Find the button element inside the notice (based on the button's role, attributes, or other context)
    const button = noticeElement.querySelector('button');

    if (button) {
        // Simulate a click on the button
        button.click();
    } else {
        console.error("Button not found in the notice element.");
    }
}
function Account_IsNoticesVisible(){
    const elExtractionHeader = document.querySelector('a[href="/listview/eventlog"]');
    if (!elExtractionHeader) return 0;
        else return 1;

}
// Run once on startup to delete old notices
function cleanOldRemovedNotices() {
    // Get current date in seconds
    const currentDateInSeconds = Math.floor(Date.now() / 1000);

    // Define 15 days in seconds (15 * 24 * 60 * 60)
    const fifteenDaysInSeconds = 15 * 24 * 60 * 60;

    // Filter the array to only keep notices that are less than 15 days old
    const filteredNotices = account_removedNoticesArray.filter(notice => {
        // Check if the notice is newer than 15 days
        return (currentDateInSeconds - notice.DateRemoved) <= fifteenDaysInSeconds;
    });

    // If any notices were removed, update the array and save to settings
    if (filteredNotices.length !== account_removedNoticesArray.length) {
        account_removedNoticesArray = filteredNotices;

        // Save the updated array to extension settings
        setExtensionMySetting('RemovedNotices', account_removedNoticesArray);
    }
}


let ScrollBarStatus = 0;
let ScrollBarElement = null;
let scrollBarPosition = 0;
let scrollBarRestore = false;
let scrollBarSize = 0;


setInterval(() => {

    if (account_LoadStatus != 2){
        if (account_LoadStatus == 1 && GetInfluenceSettings('launcherPage') == null) account_LoadStatus++;
        if (account_LoadStatus == 0 && GetInfluenceSettings('launcherPage') == "play") account_LoadStatus++;
    }

    // Account is ready for actions
    if (account_LoadStatus == 2){
        updateMySettings(); // injecting tools
        AutoProfit();
        openMyAssets();          



    if (extensionMySettings._autoHideAllNotices == true) changesOfNoticesMain();
    if (extensionMySettings._autoChangeAllUseLot == true) ReplaceAllUseLot();
    if (extensionMySettings._autoRememberMyAssetsScrollBar == true) ScrollBarMain();

    }
}, 1000);


