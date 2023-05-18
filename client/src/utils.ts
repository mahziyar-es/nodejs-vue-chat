import { Gamon } from "gamon-vue"



const isSmallScreen = () => {

    const responsiveWidth = Gamon.windowResponsiveWidth()

    return ['sm', 'xs'].indexOf(responsiveWidth) != -1
    
}

export {
    isSmallScreen,
}