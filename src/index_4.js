// storage 정보
const rustfs_info = {
    "bucket_name": "tz-bucket",
    "folder": "web_viewer_img"
}

// Leaflet 지도 생성
const map = L.map('map').setView([-7.16, 41.25], 7);
map.doubleClickZoom.disable();

// Leaflet 타일 생성
map.createPane('left')
map.createPane('right')
const leftTileLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    crs: L.CRS.EPSG4326,
    pane: 'left'
}).addTo(map);
const rightTileLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    crs: L.CRS.EPSG4326,
    pane: 'right'
}).addTo(map);
L.control.sideBySide(leftTileLayer, rightTileLayer).addTo(map)


$(document).ready(function () {
    getLeafletCustom();
    selectImage();

    document.querySelector("#select_date").addEventListener('change', (event) => {
        selectImage(event.target.value);
    })

    getColorbar("colorbar_chl", [0.01, 0.1, 1, 10], "right", "mg/m³")
    getColorbar("colorbar_sst", [25, 26, 27, 28, 29, 30, 31, 32], "right", "℃")
})

// custom layer 생성
function getLeafletCustom(){
    // 데이터 드롭다운
    const customLayer = L.control({ position: 'topright' });
    customLayer.onAdd = () => {
        const customDiv = L.DomUtil.create('div');
        customDiv.id = 'layer-menu'
        customDiv.innerHTML = `<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4">
                            <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">SST + Chl-a</h3>
                            </div>
                            <div class="text-sm bg-white text-right py-1"><span>Date: </span>` + getImageOverlay() + `</div></div>`
        return customDiv;
    }
    customLayer.addTo(map);

    // 컬러바(left, sst)
    const customColorbar_left = L.control({ position: 'bottomleft' });
    customColorbar_left.onAdd = () => {
        const colorbarDiv = L.DomUtil.create('div', 'colorbar-wrapper-left');
        colorbarDiv.innerHTML = `<canvas class="colorbar" id="colorbar_sst" width="150px" height="380px"></canvas>`
        return colorbarDiv
    }
    customColorbar_left.addTo(map)

    // 컬러바(right, chl-a)
    const customColorbar_right = L.control({ position: 'bottomright' });
    customColorbar_right.onAdd = () => {
        const colorbarDiv = L.DomUtil.create('div', 'colorbar-wrapper-left');
        colorbarDiv.innerHTML = `<canvas class="colorbar" id="colorbar_chl" width="200px" height="380px"></canvas>`
        return colorbarDiv
    }
    customColorbar_right.addTo(map)
}

// 저장된 파일 중 중복되는 자료 호출
function getImageOverlay() {
    let sstDateList = [];
    let sstAllList = [];
    let chlDateList = [];
    let chlAllList = [];

    $.ajax({
        type: "POST",
        url: "https://tzapi.s-dev.ust21.kr/int/v1/storage/objects_recent",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(rustfs_info),
        async: false,
        success : function(res) {
            let objects = res.objects;
            for(let i=0; i<objects.length; i++){
                let filename = objects[i].FileName;
                if (filename.startsWith('sst')){
                    let thisDate = filename.substring(8, 17)
                    thisDate = thisDate.replace('.', '');
                    sstDateList.push(thisDate)
                    sstAllList.push(filename);
                } else {
                    let thisDate = filename.substring(28,36);
                    chlDateList.push(thisDate);
                    chlAllList.push(filename);
                }
            }
        }
    });

    let dropdownResult = `<select id='select_date'>`;
    let duplicated = sstDateList.filter(date => chlDateList.includes(date));
    for(let i=0; i<duplicated.length; i++){
        let thisDate = duplicated[i];
        dropdownResult += `<option value="`+thisDate+`">`+thisDate+`</option>`
    }
    dropdownResult += `</select>`
    return dropdownResult;
}

// 선택한 이미지 출력
function selectImage(paramDate){
    let selectedDate = document.querySelector("#select_date").value;
    if(paramDate) selectedDate = paramDate;

    const latLngBounds = L.latLngBounds([
        [-10.0, 38.2],
        [-4.8, 43]
    ]);

    let sstDate = selectedDate.substring(0,4)+'.'+selectedDate.substring(4,8)
    let imageSST = 'https://dl.s-dev.ust21.kr/'+rustfs_info.bucket_name+"/"+rustfs_info.folder+'/sst/UTC.'+sstDate+'.DM.OISST.UTC00~24max_web.png'
    let imageCHL = 'https://dl.s-dev.ust21.kr/'+rustfs_info.bucket_name+"/"+rustfs_info.folder+'/chl/UST21_L3_Merged-Chla-1D_'+selectedDate+'_web.png'

    resetImageLayer();
    L.imageOverlay(imageSST, latLngBounds, { pane: 'left' }).addTo(map);
    L.imageOverlay(imageCHL, latLngBounds, { pane: 'right' }).addTo(map);
}

// 출력된 위성영상 이미지 초기화
function resetImageLayer(){
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }

        let checkUrl = layer._url;
        if (checkUrl && checkUrl.search('google') == -1) {
            layer.remove();
        }
    });
}